use std::path::{Path, PathBuf};
use sysinfo::{ProcessesToUpdate, System};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkBuddyProcess {
    pub pid: u32,
    pub executable: PathBuf,
}

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

pub fn is_workbuddy_executable(executable: &Path, install_path: &Path) -> bool {
    if install_path.extension().and_then(|ext| ext.to_str()) == Some("app") {
        executable.starts_with(install_path) && executable != install_path
    } else {
        executable == install_path
    }
}

pub fn list_verified_workbuddy_processes() -> Vec<WorkBuddyProcess> {
    let Some(install_path) = find_workbuddy_install_path() else {
        return Vec::new();
    };
    let install_path = install_path.canonicalize().unwrap_or(install_path);
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    sys.processes()
        .iter()
        .filter_map(|(pid, process)| {
            let executable = process.exe()?.to_path_buf();
            let executable = executable.canonicalize().unwrap_or(executable);
            is_workbuddy_executable(&executable, &install_path).then(|| WorkBuddyProcess {
                pid: pid.as_u32(),
                executable,
            })
        })
        .collect()
}

pub fn check_workbuddy_running() -> Option<u32> {
    list_verified_workbuddy_processes()
        .into_iter()
        .map(|process| process.pid)
        .next()
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_binary_inside_detected_macos_bundle() {
        let install = Path::new("/Applications/WorkBuddy.app");
        let exe = Path::new("/Applications/WorkBuddy.app/Contents/MacOS/Electron");
        assert!(is_workbuddy_executable(exe, install));
    }

    #[test]
    fn rejects_similar_names_outside_bundle() {
        let install = Path::new("/Applications/WorkBuddy.app");
        assert!(!is_workbuddy_executable(
            Path::new("/tmp/FakeWorkBuddy.app/Contents/MacOS/Electron"),
            install
        ));
        assert!(!is_workbuddy_executable(
            Path::new("/usr/local/bin/editor_sdk"),
            install
        ));
    }
}
