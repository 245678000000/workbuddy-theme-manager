use std::collections::HashSet;
use std::sync::{Mutex, MutexGuard};

pub const WORKBUDDY_DEFAULT_PORT: u16 = 9333;

#[derive(Debug, Default)]
pub struct CdpSessionState {
    port: u16,
    owned: bool,
    installed_target_ids: HashSet<String>,
}

impl CdpSessionState {
    pub fn mark_owned(&mut self, port: u16) {
        if self.port != port {
            self.installed_target_ids.clear();
        }
        self.port = port;
        self.owned = true;
    }

    pub fn clear(&mut self) {
        self.port = 0;
        self.owned = false;
        self.installed_target_ids.clear();
    }

    pub fn require_owned(&self, port: u16) -> Result<(), String> {
        if self.owned && self.port == port {
            Ok(())
        } else {
            Err("当前调试端口不属于本管理器启动的 WorkBuddy 会话".into())
        }
    }

    pub fn is_owned(&self, port: u16) -> bool {
        self.require_owned(port).is_ok()
    }

    pub fn is_loader_installed(&self, target_id: &str) -> bool {
        self.installed_target_ids.contains(target_id)
    }

    pub fn mark_loader_installed(&mut self, target_id: &str) {
        self.installed_target_ids.insert(target_id.to_string());
    }
}

pub fn lock_session(session: &Mutex<CdpSessionState>) -> MutexGuard<'_, CdpSessionState> {
    session
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_unowned_endpoint() {
        let state = CdpSessionState::default();
        assert!(state.require_owned(9333).is_err());
    }

    #[test]
    fn tracks_loader_installation_per_target() {
        let mut state = CdpSessionState::default();
        state.mark_owned(9333);
        assert!(!state.is_loader_installed("target-a"));
        state.mark_loader_installed("target-a");
        assert!(state.is_loader_installed("target-a"));
        assert!(!state.is_loader_installed("target-b"));
    }

    #[test]
    fn changing_owned_port_clears_loader_marks() {
        let mut state = CdpSessionState::default();
        state.mark_owned(9333);
        state.mark_loader_installed("target-a");
        state.mark_owned(9334);
        assert!(!state.is_loader_installed("target-a"));
        assert!(state.require_owned(9334).is_ok());
    }

    #[test]
    fn clear_drops_ownership() {
        let mut state = CdpSessionState::default();
        state.mark_owned(9333);
        state.mark_loader_installed("target-a");
        state.clear();
        assert!(state.require_owned(9333).is_err());
        assert!(!state.is_loader_installed("target-a"));
    }
}
