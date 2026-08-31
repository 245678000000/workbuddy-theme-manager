use super::detector::find_workbuddy_install_path;
use std::process::Command;

pub fn launch_workbuddy_with_cdp(port: u16) -> Result<(), String> {
    let install_path = find_workbuddy_install_path()
        .ok_or_else(|| "未检测到本机安装的 WorkBuddy 客户端".to_string())?;

    // 先彻底清理可能存在的旧实例，确保端口干净绑定
    let _ = terminate_workbuddy();
    std::thread::sleep(std::time::Duration::from_millis(600));

    #[cfg(target_os = "macos")]
    {
        let mac_binary = install_path.join("Contents/MacOS/Electron");
        if mac_binary.exists() {
            let mut cmd = Command::new(mac_binary);
            cmd.arg(format!("--remote-debugging-port={}", port));
            cmd.spawn()
                .map_err(|e| format!("启动 WorkBuddy 失败: {}", e))?;
            return Ok(());
        }

        let mut cmd = Command::new("open");
        cmd.arg("-n")
            .arg("-a")
            .arg(install_path.to_string_lossy().to_string())
            .arg("--args")
            .arg(format!("--remote-debugging-port={}", port));
        cmd.spawn()
            .map_err(|e| format!("启动 WorkBuddy 失败: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        let mut cmd = Command::new(install_path);
        cmd.arg(format!("--remote-debugging-port={}", port));
        cmd.spawn()
            .map_err(|e| format!("启动 WorkBuddy 失败: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let mut cmd = Command::new(install_path);
        cmd.arg(format!("--remote-debugging-port={}", port));
        cmd.spawn()
            .map_err(|e| format!("启动 WorkBuddy 失败: {}", e))?;
    }

    Ok(())
}

pub fn terminate_workbuddy() -> Result<(), String> {
    #[cfg(unix)]
    {
        let _ = Command::new("pkill")
            .arg("-9")
            .arg("-f")
            .arg("WorkBuddy")
            .status();
        let _ = Command::new("pkill")
            .arg("-9")
            .arg("-f")
            .arg("editor_sdk")
            .status();
    }
    #[cfg(windows)]
    {
        let _ = Command::new("taskkill")
            .arg("/F")
            .arg("/IM")
            .arg("WorkBuddy.exe")
            .status();
    }
    Ok(())
}
