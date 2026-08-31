use std::process::Command;
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use sysinfo::{Pid, ProcessesToUpdate, Signal, System};

use super::detector::{
    check_cdp_port_available, find_workbuddy_install_path, list_verified_workbuddy_processes,
};
use crate::cdp::session::{lock_session, CdpSessionState, WORKBUDDY_DEFAULT_PORT};

pub fn preflight_launch(running: bool, port_occupied: bool) -> Result<(), String> {
    if running {
        return Err("WorkBuddy 已在运行，请先使用“安全关闭”后再启动调试会话".into());
    }
    if port_occupied {
        return Err("调试端口已被其他进程占用，拒绝连接".into());
    }
    Ok(())
}

pub async fn launch_workbuddy_with_cdp(session: &Mutex<CdpSessionState>) -> Result<(), String> {
    let port = WORKBUDDY_DEFAULT_PORT;
    preflight_launch(
        !list_verified_workbuddy_processes().is_empty(),
        check_cdp_port_available(port).await,
    )?;
    spawn_workbuddy_with_cdp(port)?;
    wait_for_owned_cdp(session, port).await
}

fn spawn_workbuddy_with_cdp(port: u16) -> Result<(), String> {
    let install_path = find_workbuddy_install_path()
        .ok_or_else(|| "未检测到本机安装的 WorkBuddy 客户端".to_string())?;

    #[cfg(target_os = "macos")]
    {
        let mac_binary = install_path.join("Contents/MacOS/Electron");
        if mac_binary.exists() {
            Command::new(mac_binary)
                .arg(format!("--remote-debugging-port={port}"))
                .spawn()
                .map_err(|e| format!("启动 WorkBuddy 失败: {e}"))?;
        } else {
            Command::new("open")
                .arg("-n")
                .arg("-a")
                .arg(install_path.to_string_lossy().to_string())
                .arg("--args")
                .arg(format!("--remote-debugging-port={port}"))
                .spawn()
                .map_err(|e| format!("启动 WorkBuddy 失败: {e}"))?;
        }
    }

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        Command::new(install_path)
            .arg(format!("--remote-debugging-port={port}"))
            .spawn()
            .map_err(|e| format!("启动 WorkBuddy 失败: {e}"))?;
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        let _ = (install_path, port);
        return Err("当前平台不支持启动 WorkBuddy".into());
    }

    Ok(())
}

async fn wait_for_owned_cdp(session: &Mutex<CdpSessionState>, port: u16) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(8);
    loop {
        if check_cdp_port_available(port).await {
            lock_session(session).mark_owned(port);
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err("启动后未在 8 秒内检测到调试端口，拒绝接管会话".into());
        }
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preflight_rejects_running_workbuddy() {
        let err = preflight_launch(true, false).unwrap_err();
        assert!(err.contains("安全关闭"));
    }

    #[test]
    fn preflight_rejects_occupied_port() {
        let err = preflight_launch(false, true).unwrap_err();
        assert_eq!(err, "调试端口已被其他进程占用，拒绝连接");
    }

    #[test]
    fn preflight_allows_clean_launch() {
        assert!(preflight_launch(false, false).is_ok());
    }
}
