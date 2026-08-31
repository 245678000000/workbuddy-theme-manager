pub mod cdp;
pub mod commands;
pub mod process;
pub mod skin;

use std::sync::Mutex;

use cdp::session::CdpSessionState;
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(CdpSessionState::default()))
        .invoke_handler(tauri::generate_handler![
            get_workbuddy_status,
            launch_workbuddy,
            close_workbuddy,
            apply_skin,
            apply_raw_css,
            reset_skin,
            get_skins,
            get_active_skin_id,
            save_custom_skin,
            delete_custom_skin
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用程序时发生错误");
}
