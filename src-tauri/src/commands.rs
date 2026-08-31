use crate::cdp::injector::{
    inject_payload, inject_raw_css, mark_cdp_session_down, reset_css_on_all_targets,
};
use crate::process::detector::{
    check_cdp_port_available, check_workbuddy_running, find_workbuddy_install_path,
};
use crate::process::launcher::{launch_workbuddy_with_cdp, terminate_workbuddy};
use crate::skin::compiler;
use crate::skin::manager::{
    clear_active_skin_id, delete_custom_skin_from_disk, find_skin, list_all_skins,
    load_active_skin_id, save_active_skin_id, save_custom_skin_to_disk,
};
use crate::skin::models::{Skin, SkinConfig, WorkBuddyStatus};
use tauri::command;

pub const WORKBUDDY_DEFAULT_PORT: u16 = 9333;

#[command]
pub async fn get_workbuddy_status(port: Option<u16>) -> WorkBuddyStatus {
    let port = port.unwrap_or(WORKBUDDY_DEFAULT_PORT);
    let install_path = find_workbuddy_install_path().map(|p| p.to_string_lossy().to_string());
    let is_installed = install_path.is_some();
    let pid = check_workbuddy_running();
    let is_running = pid.is_some();
    let cdp_connected = if is_running {
        check_cdp_port_available(port).await
    } else {
        false
    };

    if !cdp_connected {
        mark_cdp_session_down();
    }

    WorkBuddyStatus {
        is_installed,
        install_path,
        is_running,
        cdp_connected,
        debugging_port: port,
        pid,
    }
}

#[command]
pub async fn launch_workbuddy(port: Option<u16>) -> Result<(), String> {
    let port = port.unwrap_or(WORKBUDDY_DEFAULT_PORT);
    launch_workbuddy_with_cdp(port)
}

#[command]
pub async fn close_workbuddy() -> Result<(), String> {
    terminate_workbuddy()
}

#[command]
pub async fn apply_skin(skin_id: String, port: Option<u16>) -> Result<usize, String> {
    let port = port.unwrap_or(WORKBUDDY_DEFAULT_PORT);
    if skin_id == "builtin-default" {
        let count = reset_css_on_all_targets(port).await?;
        clear_active_skin_id();
        return Ok(count);
    }

    let skin = find_skin(&skin_id).ok_or_else(|| format!("未找到皮肤「{skin_id}」"))?;
    let payload = compiler::compile(&skin)?;
    let count = inject_payload(port, &payload).await?;
    let _ = save_active_skin_id(&skin_id);
    Ok(count)
}

#[command]
pub async fn apply_raw_css(css: String, port: Option<u16>) -> Result<usize, String> {
    let port = port.unwrap_or(WORKBUDDY_DEFAULT_PORT);
    inject_raw_css(port, &css).await
}

#[command]
pub async fn reset_skin(port: Option<u16>) -> Result<usize, String> {
    let port = port.unwrap_or(WORKBUDDY_DEFAULT_PORT);
    let count = reset_css_on_all_targets(port).await?;
    clear_active_skin_id();
    Ok(count)
}

#[command]
pub fn get_active_skin_id() -> Option<String> {
    load_active_skin_id()
}

#[command]
pub fn get_skins() -> Vec<Skin> {
    list_all_skins()
}

#[command]
pub fn save_custom_skin(
    name: String,
    description: String,
    theme_mode: String,
    accent_color: String,
    css_content: String,
    config: SkinConfig,
) -> Result<Skin, String> {
    save_custom_skin_to_disk(
        &name,
        &description,
        &theme_mode,
        &accent_color,
        &css_content,
        &config,
    )
}

#[command]
pub fn delete_custom_skin(skin_id: String) -> Result<(), String> {
    delete_custom_skin_from_disk(&skin_id)
}
