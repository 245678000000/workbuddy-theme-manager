use std::sync::Mutex;

use serde_json::json;

use super::client::{get_cdp_targets, send_cdp_commands, CdpTarget};
use crate::skin::compiler::{self, SkinPayload};

static LOADER_INSTALLED: Mutex<bool> = Mutex::new(false);

pub fn mark_cdp_session_down() {
    if let Ok(mut flag) = LOADER_INSTALLED.lock() {
        *flag = false;
    }
}

fn is_injectable(target: &CdpTarget) -> bool {
    matches!(target.target_type.as_str(), "page" | "iframe")
        && target.web_socket_debugger_url.is_some()
        && !target.url.starts_with("devtools://")
        && !target.url.starts_with("chrome-extension://")
}

async fn injectable_targets(port: u16) -> Result<Vec<CdpTarget>, String> {
    let targets = get_cdp_targets(port).await?;
    let filtered: Vec<_> = targets.into_iter().filter(is_injectable).collect();
    if filtered.is_empty() {
        return Err("未找到可注入的 WorkBuddy 页面，请确认客户端已打开主窗口。".into());
    }
    Ok(filtered)
}

pub async fn inject_payload(port: u16, payload: &SkinPayload) -> Result<usize, String> {
    let script = compiler::apply_script(payload)?;
    let persist = compiler::persist_loader_source();
    let targets = injectable_targets(port).await?;
    let mut success = 0;
    let mut last_error = None;
    let mut installed = LOADER_INSTALLED.lock().map(|g| *g).unwrap_or(false);

    for target in targets {
        let Some(ws_url) = &target.web_socket_debugger_url else {
            continue;
        };

        let mut commands = Vec::new();
        if !installed {
            commands.push(("Page.enable".to_string(), json!({})));
            commands.push((
                "Page.addScriptToEvaluateOnNewDocument".to_string(),
                json!({ "source": persist }),
            ));
        }
        commands.push((
            "Runtime.evaluate".to_string(),
            json!({
                "expression": script,
                "returnByValue": true
            }),
        ));

        match send_cdp_commands(ws_url, commands).await {
            Ok(_) => {
                success += 1;
                installed = true;
            }
            Err(err) => last_error = Some(err),
        }
    }

    if let Ok(mut flag) = LOADER_INSTALLED.lock() {
        *flag = installed;
    }

    if success == 0 {
        return Err(
            last_error.unwrap_or_else(|| "皮肤注入失败：WorkBuddy 页面没有接受脚本。".into())
        );
    }
    Ok(success)
}

pub async fn reset_css_on_all_targets(port: u16) -> Result<usize, String> {
    let script = compiler::reset_script()?;
    let targets = injectable_targets(port).await?;
    let mut success = 0;
    for target in targets {
        let Some(ws_url) = &target.web_socket_debugger_url else {
            continue;
        };
        let commands = vec![(
            "Runtime.evaluate".to_string(),
            json!({
                "expression": script,
                "returnByValue": true
            }),
        )];
        if send_cdp_commands(ws_url, commands).await.is_ok() {
            success += 1;
        }
    }
    Ok(success)
}

pub async fn inject_raw_css(port: u16, css: &str) -> Result<usize, String> {
    let payload = SkinPayload {
        skin_id: "raw-preview".into(),
        css: css.to_string(),
        force_dark: true,
        stage: None,
        reset: false,
    };
    inject_payload(port, &payload).await
}
