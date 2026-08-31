use std::path::{Path, PathBuf};
use sysinfo::{ProcessesToUpdate, System};

pub fn find_workbuddy_install_path() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        let default_app = Path::new("/Applications/WorkBuddy.app");
        if default_app.exists() {
            return Some(default_app.to_path_buf());
        }
        if let Some(home) = dirs::home_dir() {
            let user_app = home.join("Applications/WorkBuddy.app");
            if user_app.exists() {
                return Some(user_app);
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(local_app_data) = dirs::data_local_dir() {
            let win_path = local_app_data.join("Programs/WorkBuddy/WorkBuddy.exe");
            if win_path.exists() {
                return Some(win_path);
            }
        }
        let prog_files = Path::new("C:\\Program Files\\WorkBuddy\\WorkBuddy.exe");
        if prog_files.exists() {
            return Some(prog_files.to_path_buf());
        }
    }

    #[cfg(target_os = "linux")]
    {
        let linux_path = Path::new("/opt/WorkBuddy/workbuddy");
        if linux_path.exists() {
            return Some(linux_path.to_path_buf());
        }
    }

    None
}

pub fn check_workbuddy_running() -> Option<u32> {
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    for (pid, process) in sys.processes() {
        let name = process.name().to_string_lossy().to_lowercase();
        let exe = process
            .exe()
            .map(|p| p.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        if name.contains("workbuddy")
            || exe.contains("workbuddy.app")
            || exe.contains("workbuddy/workbuddy")
        {
            // 过滤掉当前管理器自身（workbuddy-skin-manager）
            if !name.contains("skin-manager") && !exe.contains("skin-manager") {
                return Some(pid.as_u32());
            }
        }
    }
    None
}

pub async fn check_cdp_port_available(port: u16) -> bool {
    let url = format!("http://127.0.0.1:{}/json/version", port);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_millis(500))
        .build();

    if let Ok(client) = client {
        if let Ok(res) = client.get(&url).send().await {
            return res.status().is_success();
        }
    }
    false
}
