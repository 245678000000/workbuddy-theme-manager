use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::json;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

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
    let url = format!("http://127.0.0.1:{}/json/list", port);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("获取 CDP 目标列表失败 (端口 {}): {}", port, e))?;

    let targets: Vec<CdpTarget> = resp
        .json()
        .await
        .map_err(|e| format!("解析 CDP 目标列表 JSON 失败: {}", e))?;

    Ok(targets)
}

pub async fn send_cdp_command(
    ws_url: &str,
    method: &str,
    params: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let results = send_cdp_commands(ws_url, vec![(method.to_string(), params)]).await?;
    results
        .into_iter()
        .next()
        .ok_or_else(|| "未收到 CDP 响应".to_string())
}

pub async fn send_cdp_commands(
    ws_url: &str,
    commands: Vec<(String, serde_json::Value)>,
) -> Result<Vec<serde_json::Value>, String> {
    let (mut ws_stream, _) = connect_async(ws_url)
        .await
        .map_err(|e| format!("连接 WebSocket 失败: {e}"))?;

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

        let mut got = None;
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
                            got = Some(val);
                            break;
                        }
                    }
                }
                Ok(_) => {}
                Err(e) => return Err(format!("读取 WebSocket 响应失败: {e}")),
            }
        }
        results.push(got.ok_or_else(|| format!("未收到 CDP {method} 响应"))?);
    }

    Ok(results)
}
