use serde::{Deserialize, Serialize};

const DEFAULT_REPO: &str = "245678000000/workbuddy-theme-manager";

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct UpdateInfo {
    pub has_update: bool,
    pub current_version: String,
    pub latest_version: String,
    pub release_notes: Option<String>,
    pub release_url: Option<String>,
    pub download_url: Option<String>,
    pub published_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

#[derive(Debug, Deserialize)]
struct GithubRelease {
    tag_name: String,
    body: Option<String>,
    html_url: String,
    published_at: Option<String>,
    #[serde(default)]
    assets: Vec<GithubAsset>,
}

/// 解析语义化版本字符串 (例如 "v1.2.3" -> (1, 2, 3))
pub fn parse_semver(version: &str) -> Option<(u32, u32, u32)> {
    let clean = version.trim().trim_start_matches('v').trim_start_matches('V');
    let parts: Vec<&str> = clean.split('.').collect();
    if parts.len() < 2 {
        return None;
    }
    let major = parts.first()?.parse::<u32>().ok()?;
    let minor = parts.get(1)?.parse::<u32>().ok()?;
    let patch = parts.get(2).and_then(|p| p.parse::<u32>().ok()).unwrap_or(0);
    Some((major, minor, patch))
}

/// 判断 latest 是否比 current 新
pub fn is_newer_version(current: &str, latest: &str) -> bool {
    match (parse_semver(current), parse_semver(latest)) {
        (Some(c), Some(l)) => l > c,
        _ => {
            let c_clean = current.trim_start_matches('v');
            let l_clean = latest.trim_start_matches('v');
            l_clean != c_clean && !l_clean.is_empty()
        }
    }
}

/// 寻找针对当前操作系统最佳的安装包资源链接
fn find_best_download_asset(assets: &[GithubAsset]) -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        // 优先匹配当前架构的 dmg
        #[cfg(target_arch = "aarch64")]
        if let Some(asset) = assets.iter().find(|a| a.name.ends_with(".dmg") && a.name.contains("aarch64")) {
            return Some(asset.browser_download_url.clone());
        }
        if let Some(asset) = assets.iter().find(|a| a.name.ends_with(".dmg")) {
            return Some(asset.browser_download_url.clone());
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(asset) = assets.iter().find(|a| a.name.ends_with(".exe") || a.name.ends_with(".msi")) {
            return Some(asset.browser_download_url.clone());
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(asset) = assets.iter().find(|a| a.name.ends_with(".AppImage") || a.name.ends_with(".deb")) {
            return Some(asset.browser_download_url.clone());
        }
    }

    assets.first().map(|a| a.browser_download_url.clone())
}

/// 从 GitHub Releases API 获取最新版本信息并与当前版本对比
pub async fn check_github_update(
    custom_repo: Option<&str>,
    current_version: &str,
) -> Result<UpdateInfo, String> {
    let repo = custom_repo.unwrap_or(DEFAULT_REPO);
    let url = format!("https://api.github.com/repos/{repo}/releases/latest");

    let client = reqwest::Client::builder()
        .user_agent("WorkBuddy-Skin-Manager-Updater/1.0")
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {e}"))?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("连接 GitHub API 超时或网络异常: {e}"))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(UpdateInfo {
            has_update: false,
            current_version: current_version.to_string(),
            latest_version: current_version.to_string(),
            release_notes: None,
            release_url: None,
            download_url: None,
            published_at: None,
        });
    }

    if !response.status().is_success() {
        return Err(format!("GitHub API 返回异常状态码: {}", response.status()));
    }

    let release = response
        .json::<GithubRelease>()
        .await
        .map_err(|e| format!("解析 Release 数据失败: {e}"))?;

    let has_update = is_newer_version(current_version, &release.tag_name);
    let download_url = find_best_download_asset(&release.assets).or(Some(release.html_url.clone()));

    Ok(UpdateInfo {
        has_update,
        current_version: current_version.to_string(),
        latest_version: release.tag_name,
        release_notes: release.body,
        release_url: Some(release.html_url),
        download_url,
        published_at: release.published_at,
    })
}

/// 在系统默认浏览器中打开指定链接
pub fn open_url_in_browser(url: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| format!("打开浏览器失败: {e}"))?;
        Ok(())
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn()
            .map_err(|e| format!("打开浏览器失败: {e}"))?;
        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|e| format!("打开浏览器失败: {e}"))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_semver_works_correctly() {
        assert_eq!(parse_semver("1.0.0"), Some((1, 0, 0)));
        assert_eq!(parse_semver("v1.2.3"), Some((1, 2, 3)));
        assert_eq!(parse_semver("V2.10.4"), Some((2, 10, 4)));
        assert_eq!(parse_semver("0.9"), Some((0, 9, 0)));
        assert_eq!(parse_semver("invalid"), None);
    }

    #[test]
    fn is_newer_version_detects_upgrades() {
        assert!(is_newer_version("1.0.0", "1.0.1"));
        assert!(is_newer_version("1.0.0", "1.1.0"));
        assert!(is_newer_version("1.0.0", "2.0.0"));
        assert!(is_newer_version("v1.0.0", "v1.0.1"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
        assert!(!is_newer_version("1.2.0", "1.1.9"));
        assert!(!is_newer_version("2.0.0", "1.9.9"));
    }

    #[test]
    fn download_asset_matcher_extracts_correct_extension() {
        let assets = vec![
            GithubAsset {
                name: "WorkBuddy_1.1.0_x64.dmg".into(),
                browser_download_url: "https://example.com/x64.dmg".into(),
            },
            GithubAsset {
                name: "WorkBuddy_1.1.0_aarch64.dmg".into(),
                browser_download_url: "https://example.com/aarch64.dmg".into(),
            },
        ];

        let best = find_best_download_asset(&assets);
        assert!(best.is_some());
    }
}
