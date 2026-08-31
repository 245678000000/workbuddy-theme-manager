use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use super::models::{Skin, SkinConfig, SkinManifest, SkinTokens};
use super::paths::SkinPaths;

pub fn get_user_skins_dir() -> PathBuf {
    let base = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    let skin_dir = base.join(".workbuddy-skins");
    if !skin_dir.exists() {
        let _ = fs::create_dir_all(&skin_dir);
    }
    skin_dir
}

fn active_path() -> PathBuf {
    get_user_skins_dir().join("active.json")
}

fn validate_custom_skin_id(skin_id: &str) -> Result<(), String> {
    let suffix = skin_id
        .strip_prefix("custom-")
        .ok_or_else(|| "只能操作自定义皮肤".to_string())?;
    if suffix.is_empty() || suffix.len() > 64 {
        return Err("自定义皮肤 ID 长度无效".into());
    }
    if !suffix
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err("自定义皮肤 ID 含非法字符".into());
    }
    Ok(())
}

fn custom_skin_dir(user_root: &Path, skin_id: &str) -> Result<PathBuf, String> {
    validate_custom_skin_id(skin_id)?;
    let candidate = user_root.join(skin_id);
    if candidate.parent() != Some(user_root) {
        return Err("皮肤目录越出本地皮肤库".into());
    }
    Ok(candidate)
}

pub fn save_active_skin_id(skin_id: &str) -> Result<(), String> {
    let payload = serde_json::json!({ "skin_id": skin_id });
    fs::write(active_path(), payload.to_string()).map_err(|e| format!("写入当前皮肤失败: {e}"))
}

pub fn clear_active_skin_id() {
    let _ = fs::remove_file(active_path());
}

pub fn load_active_skin_id() -> Option<String> {
    let raw = fs::read_to_string(active_path()).ok()?;
    serde_json::from_str::<serde_json::Value>(&raw)
        .ok()?
        .get("skin_id")?
        .as_str()
        .map(|s| s.to_string())
}

fn builtin(
    id: &str,
    name: &str,
    description: &str,
    theme_mode: &str,
    accent: &str,
    tokens: SkinTokens,
    config: SkinConfig,
) -> Skin {
    Skin {
        manifest: SkinManifest {
            id: id.to_string(),
            name: name.to_string(),
            version: "1.0.0".to_string(),
            author: if id == "jingtian-starlight" {
                "Wangnov".into()
            } else if id == "builtin-default" {
                "Tencent WorkBuddy".into()
            } else {
                "WorkBuddy Skin Manager".into()
            },
            description: description.to_string(),
            theme_mode: theme_mode.to_string(),
            accent_color: accent.to_string(),
            target_version: ">=1.0.0".to_string(),
        },
        css_content: String::new(),
        config,
        preview_data_url: None,
        is_builtin: true,
        source_path: None,
        tokens: Some(tokens),
    }
}

pub fn get_builtin_skins(paths: &SkinPaths) -> Vec<Skin> {
    let jingtian_tokens = SkinTokens {
        bg: "#E8E4FF".into(),
        surface: "#FFFFFF".into(),
        text: "#2B2458".into(),
        text_muted: "#6E6694".into(),
        accent: "#7046E8".into(),
        border: "rgba(112, 70, 232, 0.16)".into(),
        panel_opacity: 0.58,
        blur: 22,
        chat_bg: "#FFFFFF".into(),
        main_opacity: 0.08,
        bubble_user: "rgba(112, 70, 232, 0.92)".into(),
        bubble_user_text: "#FFFFFF".into(),
        bubble_assistant: "rgba(255, 255, 255, 0.12)".into(),
        bubble_assistant_text: "#2B2458".into(),
        force_dark: false,
        color_scheme: "light".into(),
        font_family: Some("SF Pro Text, PingFang SC, system-ui".into()),
        bg_image: None,
        portrait_shadow: Some("rgba(112, 70, 232, 0.28)".into()),
    };

    let mut cyber = SkinTokens::dark("#00f0ff");
    cyber.bg = "#070913".into();
    cyber.surface = "#0d1224".into();
    cyber.chat_bg = "#070913".into();
    cyber.border = "rgba(0, 240, 255, 0.28)".into();
    cyber.panel_opacity = 0.88;
    cyber.blur = 16;
    cyber.main_opacity = 0.86;
    cyber.bubble_user = "#00f0ff".into();
    cyber.bubble_user_text = "#041016".into();
    cyber.bubble_assistant = "rgba(13, 18, 36, 0.9)".into();
    cyber.font_family = Some("JetBrains Mono, Fira Code, system-ui".into());
    cyber.bg_image = Some(
        "radial-gradient(circle at 20% 0%, rgba(0, 240, 255, 0.16), transparent 42%), radial-gradient(circle at 90% 100%, rgba(255, 0, 128, 0.14), transparent 40%)".into(),
    );

    let mut frosted = SkinTokens::dark("#38bdf8");
    frosted.bg = "#0b0f19".into();
    frosted.surface = "#0f172a".into();
    frosted.chat_bg = "#0b0f19".into();
    frosted.panel_opacity = 0.7;
    frosted.blur = 24;
    frosted.main_opacity = 0.62;
    frosted.bubble_user = "#38bdf8".into();
    frosted.bubble_user_text = "#041018".into();
    frosted.bg_image = Some(
        "radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.16), transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.14), transparent 42%)".into(),
    );

    let mut vscode = SkinTokens::dark("#007acc");
    vscode.bg = "#1e1e1e".into();
    vscode.surface = "#252526".into();
    vscode.chat_bg = "#1e1e1e".into();
    vscode.text = "#cccccc".into();
    vscode.text_muted = "#9d9d9d".into();
    vscode.border = "#3e3e42".into();
    vscode.panel_opacity = 1.0;
    vscode.blur = 0;
    vscode.main_opacity = 1.0;
    vscode.bubble_user = "#007acc".into();
    vscode.bubble_user_text = "#ffffff".into();
    vscode.bubble_assistant = "#2d2d2d".into();
    vscode.bubble_assistant_text = "#cccccc".into();
    vscode.font_family = Some("Consolas, 'Courier New', monospace".into());

    let mut parchment = SkinTokens::light("#b45309");
    parchment.bg = "#fbf7ee".into();
    parchment.surface = "#fffaf1".into();
    parchment.chat_bg = "#fbf7ee".into();
    parchment.text = "#2d261e".into();
    parchment.text_muted = "#635747".into();
    parchment.border = "#e5dac4".into();
    parchment.bubble_user = "#b45309".into();
    parchment.bubble_assistant = "#ffffff".into();
    parchment.font_family = Some("Georgia, 'Songti SC', serif".into());

    let mut skins = vec![
        builtin(
            "builtin-default",
            "官方原味 (Stock Native)",
            "恢复 WorkBuddy 官方原生视觉设计与配色方案",
            "dark",
            "#0066FF",
            SkinTokens::dark("#0066FF"),
            SkinConfig::default(),
        ),
        builtin(
            "jingtian-starlight",
            "景甜 · STARLIGHT 星蝶光廊",
            "偶像星蝶浅色陪伴主题：浅色星蝶壁纸透出，主页收紧贴立绘，浅色/深色模式共用一套玻璃控件。",
            "light",
            "#7046E8",
            jingtian_tokens,
            SkinConfig {
                opacity: 0.58,
                blur: 22,
                custom_accent: Some("#7046E8".into()),
                font_family: Some("SF Pro Text, PingFang SC, system-ui".into()),
                bg_image_base64: None,
                custom_css: None,
            },
        ),
        builtin(
            "builtin-cyberpunk",
            "赛博霓虹 (Cyberpunk Neon)",
            "高对比度深黑底色，融合青荧与紫粉霓虹微光",
            "dark",
            "#00f0ff",
            cyber,
            SkinConfig {
                opacity: 0.88,
                blur: 16,
                custom_accent: Some("#00f0ff".into()),
                font_family: Some("JetBrains Mono, Fira Code, system-ui".into()),
                bg_image_base64: None,
                custom_css: None,
            },
        ),
        builtin(
            "builtin-frosted-glass",
            "深空毛玻璃 (Frosted Glass)",
            "现代透亮毛玻璃质感，精致半透明层次与柔和环境光",
            "dark",
            "#38bdf8",
            frosted,
            SkinConfig {
                opacity: 0.7,
                blur: 24,
                custom_accent: Some("#38bdf8".into()),
                font_family: None,
                bg_image_base64: None,
                custom_css: None,
            },
        ),
        builtin(
            "builtin-parchment",
            "温润羊皮纸 (Warm Parchment)",
            "柔和米黄低疲劳护眼阅读体验，经典书卷质感",
            "light",
            "#b45309",
            parchment,
            SkinConfig {
                opacity: 1.0,
                blur: 0,
                custom_accent: Some("#b45309".into()),
                font_family: Some("Georgia, 'Songti SC', serif".into()),
                bg_image_base64: None,
                custom_css: None,
            },
        ),
        builtin(
            "builtin-vscode-dark",
            "VS Code 极客暗黑 (Dark+ Pro)",
            "经典开发者暗黑灰度基调与纯净代码工坊氛围",
            "dark",
            "#007acc",
            vscode,
            SkinConfig {
                opacity: 1.0,
                blur: 0,
                custom_accent: Some("#007acc".into()),
                font_family: Some("Consolas, 'Courier New', monospace".into()),
                bg_image_base64: None,
                custom_css: None,
            },
        ),
    ];

    for skin in &mut skins {
        let dir = paths.bundled_skin_dir(&skin.manifest.id);
        if dir.is_dir() {
            skin.source_path = Some(dir.to_string_lossy().to_string());
        }
    }
    skins
}

pub fn list_all_skins(paths: &SkinPaths) -> Vec<Skin> {
    let mut skins = get_builtin_skins(paths);
    let mut seen: HashSet<String> = skins.iter().map(|s| s.manifest.id.clone()).collect();
    let user_dir = &paths.user_root;

    if let Ok(entries) = fs::read_dir(user_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let manifest_file = path.join("manifest.json");
            let css_file = path.join("theme.css");
            if !manifest_file.exists() {
                continue;
            }
            let Ok(manifest_str) = fs::read_to_string(&manifest_file) else {
                continue;
            };
            let Ok(manifest) = serde_json::from_str::<SkinManifest>(&manifest_str) else {
                continue;
            };
            if validate_custom_skin_id(&manifest.id).is_err()
                || path.file_name().and_then(|name| name.to_str()) != Some(manifest.id.as_str())
            {
                continue;
            }
            if seen.contains(&manifest.id) {
                continue;
            }

            let css_content = if css_file.exists() {
                fs::read_to_string(&css_file).unwrap_or_default()
            } else {
                String::new()
            };

            let mut config = SkinConfig::default();
            let config_file = path.join("config.json");
            if config_file.exists() {
                if let Ok(config_str) = fs::read_to_string(&config_file) {
                    if let Ok(c) = serde_json::from_str::<SkinConfig>(&config_str) {
                        config = c;
                    }
                }
            }

            seen.insert(manifest.id.clone());
            skins.push(Skin {
                manifest,
                css_content,
                config,
                preview_data_url: None,
                is_builtin: false,
                source_path: Some(path.to_string_lossy().to_string()),
                tokens: None,
            });
        }
    }

    skins
}

pub fn find_skin(paths: &SkinPaths, skin_id: &str) -> Option<Skin> {
    list_all_skins(paths)
        .into_iter()
        .find(|s| s.manifest.id == skin_id)
}

pub fn save_custom_skin_to_disk(
    paths: &SkinPaths,
    name: &str,
    description: &str,
    theme_mode: &str,
    accent_color: &str,
    css_content: &str,
    config: &SkinConfig,
) -> Result<Skin, String> {
    let skin_id = format!("custom-{}", &uuid::Uuid::new_v4().to_string()[0..8]);
    let user_dir = paths.user_skin_dir(&skin_id);

    fs::create_dir_all(&user_dir).map_err(|e| format!("创建皮肤目录失败: {e}"))?;

    let manifest = SkinManifest {
        id: skin_id.clone(),
        name: name.to_string(),
        version: "1.0.0".to_string(),
        author: "User Custom".to_string(),
        description: description.to_string(),
        theme_mode: theme_mode.to_string(),
        accent_color: accent_color.to_string(),
        target_version: ">=1.0.0".to_string(),
    };

    let manifest_json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("序列化 manifest 失败: {e}"))?;
    fs::write(user_dir.join("manifest.json"), manifest_json)
        .map_err(|e| format!("写入 manifest.json 失败: {e}"))?;

    fs::write(user_dir.join("theme.css"), css_content)
        .map_err(|e| format!("写入 theme.css 失败: {e}"))?;

    let config_json =
        serde_json::to_string_pretty(config).map_err(|e| format!("序列化 config 失败: {e}"))?;
    fs::write(user_dir.join("config.json"), config_json)
        .map_err(|e| format!("写入 config.json 失败: {e}"))?;

    Ok(Skin {
        manifest,
        css_content: css_content.to_string(),
        config: config.clone(),
        preview_data_url: None,
        is_builtin: false,
        source_path: Some(user_dir.to_string_lossy().to_string()),
        tokens: None,
    })
}

pub fn delete_custom_skin_from_disk(paths: &SkinPaths, skin_id: &str) -> Result<(), String> {
    let user_dir = custom_skin_dir(&paths.user_root, skin_id)?;
    if user_dir.exists() {
        fs::remove_dir_all(user_dir).map_err(|e| format!("删除皮肤目录失败: {e}"))?;
    }
    if load_active_skin_id().as_deref() == Some(skin_id) {
        clear_active_skin_id();
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn custom_skin_id_accepts_generated_ids() {
        assert!(validate_custom_skin_id("custom-deadbeef").is_ok());
    }

    #[test]
    fn custom_skin_id_rejects_traversal_and_absolute_paths() {
        for value in [
            "../outside",
            "custom-../../outside",
            "/tmp/outside",
            ".",
            "builtin-default",
        ] {
            assert!(validate_custom_skin_id(value).is_err(), "accepted {value}");
        }
    }

    #[test]
    fn custom_skin_id_rejects_separators_and_overlong_values() {
        assert!(validate_custom_skin_id("custom-a/b").is_err());
        assert!(validate_custom_skin_id(&format!("custom-{}", "a".repeat(65))).is_err());
    }
}
