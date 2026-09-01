use std::sync::Mutex;

use serde_json::json;

use super::client::{get_cdp_targets, send_cdp_commands, CdpTarget};
use super::session::{lock_session, CdpSessionState, WORKBUDDY_DEFAULT_PORT};
use crate::skin::compiler::{self, SkinPayload};

fn require_owned_port(session: &Mutex<CdpSessionState>) -> Result<u16, String> {
    lock_session(session).require_owned(WORKBUDDY_DEFAULT_PORT)?;
    Ok(WORKBUDDY_DEFAULT_PORT)
}

fn is_injectable(target: &CdpTarget) -> bool {
    target.target_type == "page"
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

fn complete_or_error(
    total: usize,
    success: usize,
    last_error: Option<String>,
    empty_msg: &str,
) -> Result<usize, String> {
    if total == 0 || success == 0 {
        return Err(last_error.unwrap_or_else(|| empty_msg.to_string()));
    }
    if success < total {
        let detail = last_error.unwrap_or_else(|| empty_msg.to_string());
        return Err(format!("{detail}（成功 {success}/{total}）"));
    }
    Ok(success)
}

fn injection_commands(
    persist: &str,
    script: &str,
    loader_installed: bool,
) -> Vec<(String, serde_json::Value)> {
    let mut commands = Vec::new();
    if !loader_installed {
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
    commands
}

pub async fn inject_payload(
    session: &Mutex<CdpSessionState>,
    payload: &SkinPayload,
) -> Result<usize, String> {
    let port = require_owned_port(session)?;
    let script = compiler::apply_script(payload)?;
    let persist = compiler::persist_loader_source();
    let targets = injectable_targets(port).await?;
    let total = targets.len();
    let mut success = 0;
    let mut last_error = None;

    for target in targets {
        let Some(ws_url) = &target.web_socket_debugger_url else {
            last_error = Some("目标缺少 WebSocket 调试地址".into());
            continue;
        };
        let installed = lock_session(session).is_loader_installed(&target.id);
        let commands = injection_commands(&persist, &script, installed);

        match send_cdp_commands(ws_url, commands).await {
            Ok(_) => {
                success += 1;
                lock_session(session).mark_loader_installed(&target.id);
            }
            Err(err) => last_error = Some(err),
        }
    }

    complete_or_error(
        total,
        success,
        last_error,
        "皮肤注入失败：WorkBuddy 页面没有接受脚本。",
    )
}

pub async fn reset_css_on_all_targets(session: &Mutex<CdpSessionState>) -> Result<usize, String> {
    let port = require_owned_port(session)?;
    let script = compiler::reset_script()?;
    let targets = injectable_targets(port).await?;
    let total = targets.len();
    let mut success = 0;
    let mut last_error = None;
    for target in targets {
        let Some(ws_url) = &target.web_socket_debugger_url else {
            last_error = Some("目标缺少 WebSocket 调试地址".into());
            continue;
        };
        let commands = vec![(
            "Runtime.evaluate".to_string(),
            json!({
                "expression": script,
                "returnByValue": true
            }),
        )];
        match send_cdp_commands(ws_url, commands).await {
            Ok(_) => success += 1,
            Err(err) => last_error = Some(err),
        }
    }
    complete_or_error(
        total,
        success,
        last_error,
        "皮肤还原失败：WorkBuddy 页面没有接受脚本。",
    )
}

fn force_dark_from_theme_mode(theme_mode: &str) -> Result<bool, String> {
    match theme_mode {
        "dark" => Ok(true),
        "light" | "auto" => Ok(false),
        _ => Err("theme_mode 必须是 dark、light 或 auto".into()),
    }
}

pub async fn inject_raw_css(
    session: &Mutex<CdpSessionState>,
    css: &str,
    theme_mode: &str,
) -> Result<usize, String> {
    let payload = SkinPayload {
        skin_id: "raw-preview".into(),
        css: css.to_string(),
        force_dark: force_dark_from_theme_mode(theme_mode)?,
        stage: None,
        reset: false,
    };
    inject_payload(session, &payload).await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn target(target_type: &str, url: &str) -> CdpTarget {
        CdpTarget {
            id: "target-a".into(),
            title: "WorkBuddy".into(),
            target_type: target_type.into(),
            url: url.into(),
            web_socket_debugger_url: Some("ws://127.0.0.1:9333/devtools/page/a".into()),
        }
    }

    #[test]
    fn accepts_page_target_only() {
        assert!(is_injectable(&target("page", "http://localhost/")));
        assert!(!is_injectable(&target("iframe", "http://localhost/frame")));
        assert!(!is_injectable(&target("page", "devtools://devtools")));
        assert!(!is_injectable(&target(
            "page",
            "chrome-extension://example/index.html"
        )));
    }

    #[test]
    fn adds_loader_only_when_target_not_installed() {
        let cmds = injection_commands("persist", "script", false);
        assert_eq!(cmds[0].0, "Page.enable");
        assert_eq!(cmds[1].0, "Page.addScriptToEvaluateOnNewDocument");
        assert_eq!(cmds[2].0, "Runtime.evaluate");

        let cmds = injection_commands("persist", "script", true);
        assert_eq!(cmds.len(), 1);
        assert_eq!(cmds[0].0, "Runtime.evaluate");
    }

    #[test]
    fn inject_without_owned_session_is_rejected() {
        let session = Mutex::new(CdpSessionState::default());
        assert!(require_owned_port(&session).is_err());
    }

    #[test]
    fn inject_with_owned_session_uses_default_port() {
        let session = Mutex::new(CdpSessionState::default());
        lock_session(&session).mark_owned(WORKBUDDY_DEFAULT_PORT);
        assert_eq!(
            require_owned_port(&session).unwrap(),
            WORKBUDDY_DEFAULT_PORT
        );
    }

    #[test]
    fn complete_or_error_rejects_zero_success() {
        let err = complete_or_error(2, 0, Some("timeout".into()), "empty").unwrap_err();
        assert_eq!(err, "timeout");
    }

    #[test]
    fn complete_or_error_rejects_partial_success() {
        let err = complete_or_error(2, 1, Some("ws timeout".into()), "empty").unwrap_err();
        assert!(err.contains("ws timeout"));
        assert!(err.contains("1/2"));
    }

    #[test]
    fn complete_or_error_accepts_all_targets() {
        assert_eq!(complete_or_error(2, 2, None, "empty").unwrap(), 2);
    }

    #[test]
    fn raw_preview_preserves_light_theme_mode() {
        assert!(!force_dark_from_theme_mode("light").unwrap());
        assert!(!force_dark_from_theme_mode("auto").unwrap());
        assert!(force_dark_from_theme_mode("dark").unwrap());
        assert!(force_dark_from_theme_mode("unknown").is_err());
    }
}
