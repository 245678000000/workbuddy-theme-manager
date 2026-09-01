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
        font_family: Some("\"SF Pro Text\", \"PingFang SC\", system-ui".into()),
        bg_image: None,
        portrait_shadow: Some("rgba(112, 70, 232, 0.28)".into()),
    };

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
                font_family: Some("\"SF Pro Text\", \"PingFang SC\", system-ui".into()),
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
    skin_id: Option<&str>,
    name: &str,
    description: &str,
    theme_mode: &str,
    accent_color: &str,
    css_content: &str,
    config: &SkinConfig,
) -> Result<Skin, String> {
    let target_id = if let Some(id) = skin_id {
        validate_custom_skin_id(id)?;
        id.to_string()
    } else {
        format!("custom-{}", &uuid::Uuid::new_v4().to_string()[0..8])
    };

    let user_dir = paths.user_skin_dir(&target_id);
    fs::create_dir_all(&user_dir).map_err(|e| format!("创建皮肤目录失败: {e}"))?;

    let version = if user_dir.join("manifest.json").exists() {
        fs::read_to_string(user_dir.join("manifest.json"))
            .ok()
            .and_then(|str| serde_json::from_str::<SkinManifest>(&str).ok())
            .map(|m| m.version)
            .unwrap_or_else(|| "1.0.0".to_string())
    } else {
        "1.0.0".to_string()
    };

    let manifest = SkinManifest {
        id: target_id.clone(),
        name: name.to_string(),
        version,
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

    #[test]
    fn save_custom_skin_supports_new_and_override() {
        let temp_dir = std::env::temp_dir().join(format!("wb_skin_test_{}", uuid::Uuid::new_v4()));
        let paths = SkinPaths::new(temp_dir.join("bundled"), temp_dir.join("user"));
        let config = SkinConfig::default();

        // 1. 新建皮肤
        let created = save_custom_skin_to_disk(
            &paths,
            None,
            "测试皮肤",
            "测试描述",
            "dark",
            "#38bdf8",
            "body { color: red; }",
            &config,
        )
        .unwrap();
        assert!(created.manifest.id.starts_with("custom-"));
        assert_eq!(created.manifest.name, "测试皮肤");

        // 2. 原地覆盖更新
        let updated = save_custom_skin_to_disk(
            &paths,
            Some(&created.manifest.id),
            "已修改皮肤名称",
            "已更新描述",
            "light",
            "#10b981",
            "body { color: green; }",
            &config,
        )
        .unwrap();
        assert_eq!(updated.manifest.id, created.manifest.id);
        assert_eq!(updated.manifest.name, "已修改皮肤名称");
        assert_eq!(updated.manifest.theme_mode, "light");

        let found = find_skin(&paths, &created.manifest.id).unwrap();
        assert_eq!(found.manifest.name, "已修改皮肤名称");
        assert_eq!(found.css_content, "body { color: green; }");

        // 清理测试目录
        let _ = std::fs::remove_dir_all(temp_dir);
    }
}
