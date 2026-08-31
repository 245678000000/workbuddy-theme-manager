use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::json;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

const CDP_IO_TIMEOUT: Duration = Duration::from_secs(3);

#[derive(Debug, Deserialize, Clone)]
pub struct CdpTarget {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub target_type: String,
    pub url: String,
    #[serde(rename = "webSocketDebuggerUrl")]
    pub web_socket_debugger_url: Option<String>,
}

pub async fn get_cdp_targets(port: u16) -> Result<Vec<CdpTarget>, String> {
    let url = format!("http://127.0.0.1:{port}/json/list");
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {e}"))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("获取 CDP 目标列表失败 (端口 {port}): {e}"))?;
    let resp = resp
        .error_for_status()
        .map_err(|e| format!("获取 CDP 目标列表失败 (端口 {port}): {e}"))?;

    let targets: Vec<CdpTarget> = resp
        .json()
        .await
        .map_err(|e| format!("解析 CDP 目标列表 JSON 失败: {e}"))?;

    Ok(targets)
}

pub async fn send_cdp_commands(
    ws_url: &str,
    commands: Vec<(String, serde_json::Value)>,
) -> Result<Vec<serde_json::Value>, String> {
    let connect = tokio::time::timeout(CDP_IO_TIMEOUT, connect_async(ws_url))
        .await
        .map_err(|_| format!("连接 WebSocket 超时 ({ws_url})"))?;
    let (mut ws_stream, _) = connect.map_err(|e| format!("连接 WebSocket 失败: {e}"))?;

    let mut results = Vec::with_capacity(commands.len());
    for (index, (method, params)) in commands.into_iter().enumerate() {
        let id = (index + 1) as i64;
        let payload = json!({
            "id": id,
            "method": method,
            "params": params
        });
        ws_stream
            .send(Message::Text(payload.to_string()))
            .await
            .map_err(|e| format!("发送 CDP 命令失败: {e}"))?;

        let result = read_cdp_response(&mut ws_stream, id, &method)
            .await
            .map_err(|e| format!("{e} ({ws_url})"))?;
        results.push(result);
    }

    Ok(results)
}

async fn read_cdp_response<S>(
    ws_stream: &mut S,
    id: i64,
    method: &str,
) -> Result<serde_json::Value, String>
where
    S: StreamExt<Item = Result<Message, tokio_tungstenite::tungstenite::Error>> + Unpin,
{
    let wait = async {
        while let Some(msg) = ws_stream.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
                        if val.get("id").and_then(|i| i.as_i64()) == Some(id) {
                            if let Some(err) = val.get("error") {
                                return Err(format!("CDP {method} 失败: {err}"));
                            }
                            if val.pointer("/result/exceptionDetails").is_some() {
                                return Err(format!(
                                    "CDP {method} 页面脚本异常: {}",
                                    val.pointer("/result/exceptionDetails/text")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("unknown")
                                ));
                            }
                            return Ok(val);
                        }
                    }
                }
                Ok(_) => {}
                Err(e) => return Err(format!("读取 WebSocket 响应失败: {e}")),
            }
        }
        Err(format!("未收到 CDP {method} 响应"))
    };

    tokio::time::timeout(CDP_IO_TIMEOUT, wait)
        .await
        .map_err(|_| format!("CDP {method} 超时"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures_util::stream;
    use std::time::Instant;

    #[tokio::test]
    async fn times_out_when_stream_never_responds() {
        let mut stream =
            stream::pending::<Result<Message, tokio_tungstenite::tungstenite::Error>>();
        let started = Instant::now();

        let error = read_cdp_response(&mut stream, 1, "Runtime.evaluate")
            .await
            .expect_err("pending stream must time out");

        assert!(error.contains("Runtime.evaluate"));
        assert!(error.contains("超时"));
        assert!(started.elapsed() < Duration::from_secs(4));
    }
}
