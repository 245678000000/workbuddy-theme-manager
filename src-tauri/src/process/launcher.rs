use super::detector::{find_workbuddy_install_path, list_verified_workbuddy_processes};
use std::process::Command;
use std::thread;
use std::time::{Duration, Instant};
use sysinfo::{Pid, ProcessesToUpdate, Signal, System};

pub fn launch_workbuddy_with_cdp(port: u16) -> Result<(), String> {
    let install_path = find_workbuddy_install_path()
        .ok_or_else(|| "未检测到本机安装的 WorkBuddy 客户端".to_string())?;

    if !list_verified_workbuddy_processes().is_empty() {
        return Err("WorkBuddy 已在运行，请先使用“安全关闭”后再启动调试会话".into());
    }

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

pub fn terminate_workbuddy() -> Result<usize, String> {
    let verified = list_verified_workbuddy_processes();
    if verified.is_empty() {
        return Ok(0);
    }

    let pids: Vec<Pid> = verified
        .iter()
        .map(|process| Pid::from_u32(process.pid))
        .collect();
    let mut system = System::new_all();

    for pid in &pids {
        if let Some(process) = system.process(*pid) {
            let _ = process.kill_with(Signal::Term);
        }
    }

    let deadline = Instant::now() + Duration::from_secs(2);
    loop {
        system.refresh_processes(ProcessesToUpdate::Some(&pids), true);
        let remaining: Vec<Pid> = pids
            .iter()
            .copied()
            .filter(|pid| system.process(*pid).is_some())
            .collect();
        if remaining.is_empty() {
            return Ok(verified.len());
        }
        if Instant::now() >= deadline {
            let mut failed = Vec::new();
            for pid in remaining {
                let killed = system.process(pid).is_some_and(|process| process.kill());
                if !killed {
                    failed.push(pid.as_u32());
                }
            }
            return if failed.is_empty() {
                Ok(verified.len())
            } else {
                Err(format!("无法结束已验证的 WorkBuddy 进程: {failed:?}"))
            };
        }
        thread::sleep(Duration::from_millis(100));
    }
}
