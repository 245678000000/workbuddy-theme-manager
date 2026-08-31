use std::sync::Mutex;

use tauri::{command, State};

use crate::cdp::injector::{inject_payload, inject_raw_css, reset_css_on_all_targets};
use crate::cdp::session::{lock_session, CdpSessionState, WORKBUDDY_DEFAULT_PORT};
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
use crate::skin::paths::SkinPaths;

#[command]
pub async fn get_workbuddy_status(
    session: State<'_, Mutex<CdpSessionState>>,
) -> Result<WorkBuddyStatus, String> {
    let port = WORKBUDDY_DEFAULT_PORT;
    let install_path = find_workbuddy_install_path().map(|p| p.to_string_lossy().to_string());
    let is_installed = install_path.is_some();
    let pid = check_workbuddy_running();
    let is_running = pid.is_some();
    let endpoint_up = is_running && check_cdp_port_available(port).await;

    let mut state = lock_session(&session);
    if !is_running || !endpoint_up {
        state.clear();
    }
    let cdp_connected = endpoint_up && state.is_owned(port);
    drop(state);

    Ok(WorkBuddyStatus {
        is_installed,
        install_path,
        is_running,
        cdp_connected,
        debugging_port: port,
        pid,
    })
}

#[command]
pub async fn launch_workbuddy(session: State<'_, Mutex<CdpSessionState>>) -> Result<(), String> {
    launch_workbuddy_with_cdp(&session).await
}

#[command]
pub async fn close_workbuddy(session: State<'_, Mutex<CdpSessionState>>) -> Result<usize, String> {
    let count = terminate_workbuddy()?;
    lock_session(&session).clear();
    Ok(count)
}

#[command]
pub async fn apply_skin(
    skin_id: String,
    session: State<'_, Mutex<CdpSessionState>>,
    paths: State<'_, SkinPaths>,
) -> Result<usize, String> {
    if skin_id == "builtin-default" {
        let count = reset_css_on_all_targets(&session).await?;
        clear_active_skin_id();
        return Ok(count);
    }

    let skin = find_skin(&paths, &skin_id).ok_or_else(|| format!("未找到皮肤「{skin_id}」"))?;
    let payload = compiler::compile(&skin, &paths)?;
    let count = inject_payload(&session, &payload).await?;
    let _ = save_active_skin_id(&skin_id);
    Ok(count)
}

#[command]
pub async fn apply_raw_css(
    css: String,
    session: State<'_, Mutex<CdpSessionState>>,
) -> Result<usize, String> {
    inject_raw_css(&session, &css).await
}

#[command]
pub async fn reset_skin(session: State<'_, Mutex<CdpSessionState>>) -> Result<usize, String> {
    let count = reset_css_on_all_targets(&session).await?;
    clear_active_skin_id();
    Ok(count)
}

#[command]
pub fn get_active_skin_id() -> Option<String> {
    load_active_skin_id()
}

#[command]
pub fn get_skins(paths: State<'_, SkinPaths>) -> Vec<Skin> {
    list_all_skins(&paths)
}

#[command]
pub fn save_custom_skin(
    name: String,
    description: String,
    theme_mode: String,
    accent_color: String,
    css_content: String,
    config: SkinConfig,
    paths: State<'_, SkinPaths>,
) -> Result<Skin, String> {
    save_custom_skin_to_disk(
        &paths,
        &name,
        &description,
        &theme_mode,
        &accent_color,
        &css_content,
        &config,
    )
}

#[command]
pub fn delete_custom_skin(skin_id: String, paths: State<'_, SkinPaths>) -> Result<(), String> {
    delete_custom_skin_from_disk(&paths, &skin_id)
}
