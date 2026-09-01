use std::fs;
use std::path::{Path, PathBuf};

use super::models::{Skin, SkinTokens};
use super::paths::SkinPaths;
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use serde::Serialize;

const KERNEL_CSS: &str = include_str!("kernel.css");
const STAGE_JS: &str = include_str!("stage.js");
const LOADER_JS: &str = include_str!("loader.js");

#[derive(Debug, Clone, Serialize)]
pub struct StagePayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wallpaper: Option<String>,
    #[serde(rename = "portraitHome", skip_serializing_if = "Option::is_none")]
    pub portrait_home: Option<String>,
    #[serde(rename = "portraitChat", skip_serializing_if = "Option::is_none")]
    pub portrait_chat: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SkinPayload {
    #[serde(rename = "skinId")]
    pub skin_id: String,
    pub css: String,
    #[serde(rename = "forceDark")]
    pub force_dark: bool,
    pub stage: Option<StagePayload>,
    pub reset: bool,
}

pub fn persist_loader_source() -> String {
    format!("{LOADER_JS}\n{STAGE_JS}")
}

pub fn apply_script(payload: &SkinPayload) -> Result<String, String> {
    let json = serde_json::to_string(payload).map_err(|e| format!("序列化皮肤载荷失败: {e}"))?;
    Ok(format!("window.__WB_SKIN_PAYLOAD = {json};\n{STAGE_JS}"))
}

pub fn reset_script() -> Result<String, String> {
    apply_script(&SkinPayload {
        skin_id: "builtin-default".into(),
        css: String::new(),
        force_dark: false,
        stage: None,
        reset: true,
    })
}

pub fn compile(skin: &Skin, paths: &SkinPaths) -> Result<SkinPayload, String> {
    let tokens = resolve_tokens(skin);
    let token_css = token_block(&tokens);
    let extra = extra_css(skin, paths);
    let css = format!("{token_css}\n{KERNEL_CSS}\n{extra}");
    let stage = load_stage(skin, paths);
    let mut warnings_stage = stage;
    if skin.manifest.id == "jingtian-starlight" && warnings_stage.is_none() {
        warnings_stage = Some(StagePayload {
            wallpaper: None,
            portrait_home: None,
            portrait_chat: None,
        });
    }

    Ok(SkinPayload {
        skin_id: skin.manifest.id.clone(),
        css,
        force_dark: tokens.force_dark,
        stage: warnings_stage.filter(|s| {
            s.wallpaper.is_some() || s.portrait_home.is_some() || s.portrait_chat.is_some()
        }),
        reset: false,
    })
}

pub fn resolve_tokens(skin: &Skin) -> SkinTokens {
    if let Some(tokens) = &skin.tokens {
        return tokens.clone();
    }

    let accent = skin
        .config
        .custom_accent
        .clone()
        .unwrap_or_else(|| skin.manifest.accent_color.clone());
    let mut tokens = if skin.manifest.theme_mode == "light" {
        SkinTokens::light(&accent)
    } else {
        SkinTokens::dark(&accent)
    };
    if skin.config.opacity > 0.0 {
        tokens.panel_opacity = skin.config.opacity;
        tokens.main_opacity = (skin.config.opacity - 0.04).clamp(0.4, 1.0);
    }
    tokens.blur = skin.config.blur;
    tokens.font_family = skin.config.font_family.clone();
    tokens
}

fn token_block(tokens: &SkinTokens) -> String {
    let font = tokens
        .font_family
        .clone()
        .unwrap_or_else(|| "inherit".into());
    let bg_image = tokens.bg_image.clone().unwrap_or_else(|| "none".into());
    let portrait_shadow = tokens
        .portrait_shadow
        .clone()
        .unwrap_or_else(|| "rgba(0, 0, 0, 0.28)".into());

    format!(
        r#":root {{
  --wb-bg: {bg};
  --wb-surface: {surface};
  --wb-text: {text};
  --wb-text-muted: {muted};
  --wb-accent: {accent};
  --wb-border: {border};
  --wb-panel-opacity: {opacity};
  --wb-blur: {blur}px;
  --wb-chat-bg: {chat_bg};
  --wb-main-opacity: {main_opacity};
  --wb-bubble-user: {bubble_user};
  --wb-bubble-user-text: {bubble_user_text};
  --wb-bubble-assistant: {bubble_assistant};
  --wb-bubble-assistant-text: {bubble_assistant_text};
  --wb-color-scheme: {scheme};
  --wb-font: {font};
  --wb-bg-image: {bg_image};
  --wb-portrait-shadow: {portrait_shadow};
}}"#,
        bg = tokens.bg,
        surface = tokens.surface,
        text = tokens.text,
        muted = tokens.text_muted,
        accent = tokens.accent,
        border = tokens.border,
        opacity = tokens.panel_opacity,
        blur = tokens.blur,
        chat_bg = tokens.chat_bg,
        main_opacity = tokens.main_opacity,
        bubble_user = tokens.bubble_user,
        bubble_user_text = tokens.bubble_user_text,
        bubble_assistant = tokens.bubble_assistant,
        bubble_assistant_text = tokens.bubble_assistant_text,
        scheme = tokens.color_scheme,
        font = font,
        bg_image = bg_image,
        portrait_shadow = portrait_shadow,
    )
}

fn extra_css(skin: &Skin, paths: &SkinPaths) -> String {
    let mut parts = Vec::new();
    if let Some(custom) = &skin.config.custom_css {
        if !custom.trim().is_empty() {
            parts.push(custom.clone());
        }
    }
    if !skin.css_content.trim().is_empty() && !skin.is_builtin {
        parts.push(skin.css_content.clone());
    }
    if let Some(theme) = load_theme_css(skin, paths) {
        parts.push(theme);
    }
    parts.join("\n")
}

fn load_theme_css(skin: &Skin, paths: &SkinPaths) -> Option<String> {
    let mut candidates = Vec::new();
    if let Some(source) = &skin.source_path {
        candidates.push(PathBuf::from(source).join("theme.css"));
    }
    candidates.push(paths.bundled_skin_dir(&skin.manifest.id).join("theme.css"));
    candidates.push(paths.user_root.join(&skin.manifest.id).join("theme.css"));

    let mut seen = std::collections::HashSet::new();
    for path in candidates {
        let key = path.to_string_lossy().to_string();
        if !seen.insert(key) {
            continue;
        }
        if path.is_file() {
            if let Ok(css) = fs::read_to_string(&path) {
                if !css.trim().is_empty() {
                    return Some(css);
                }
            }
        }
    }
    None
}

fn load_stage(skin: &Skin, paths: &SkinPaths) -> Option<StagePayload> {
    let dirs = asset_dirs(skin, paths);
    let wallpaper = first_existing(
        &dirs,
        &["wall.webp", "wallpaper.webp", "bg.webp", "background.webp"],
    )
    .and_then(|p| file_to_data_url(&p));
    let portrait_home = first_existing(
        &dirs,
        &[
            "jingtian-home.webp",
            "home.webp",
            "portrait-home.webp",
            "portrait.webp",
        ],
    )
    .and_then(|p| file_to_data_url(&p));
    let portrait_chat = first_existing(
        &dirs,
        &["jingtian-chat.webp", "chat.webp", "portrait-chat.webp"],
    )
    .and_then(|p| file_to_data_url(&p));

    if wallpaper.is_none() && portrait_home.is_none() && portrait_chat.is_none() {
        if let Some(b64) = &skin.config.bg_image_base64 {
            if !b64.is_empty() {
                return Some(StagePayload {
                    wallpaper: Some(ensure_data_url(b64)),
                    portrait_home: None,
                    portrait_chat: None,
                });
            }
        }
        return None;
    }

    Some(StagePayload {
        wallpaper,
        portrait_home,
        portrait_chat,
    })
}

fn asset_dirs(skin: &Skin, paths: &SkinPaths) -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Some(source) = &skin.source_path {
        dirs.push(PathBuf::from(source).join("assets"));
        dirs.push(PathBuf::from(source));
    }
    let bundled = paths.bundled_skin_dir(&skin.manifest.id);
    dirs.push(bundled.join("assets"));
    dirs.push(bundled);
    dirs.push(paths.user_root.join(&skin.manifest.id).join("assets"));
    dirs.push(paths.user_root.join(&skin.manifest.id));
    dirs
}

fn first_existing(dirs: &[PathBuf], names: &[&str]) -> Option<PathBuf> {
    for dir in dirs {
        for name in names {
            let path = dir.join(name);
            if path.is_file() {
                return Some(path);
            }
        }
    }
    None
}

fn file_to_data_url(path: &Path) -> Option<String> {
    let bytes = fs::read(path).ok()?;
    let mime = match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "webp" => "image/webp",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    };
    Some(format!("data:{mime};base64,{}", STANDARD.encode(bytes)))
}

fn ensure_data_url(value: &str) -> String {
    if value.starts_with("data:") {
        value.to_string()
    } else {
        format!("data:image/webp;base64,{value}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::skin::models::{SkinConfig, SkinManifest};

    fn fixture_paths() -> crate::skin::paths::SkinPaths {
        crate::skin::paths::source_tree_paths()
    }

    fn sample(id: &str, mode: &str, tokens: Option<SkinTokens>) -> Skin {
        Skin {
            manifest: SkinManifest {
                id: id.into(),
                name: id.into(),
                version: "1.0.0".into(),
                author: "test".into(),
                description: "test".into(),
                theme_mode: mode.into(),
                accent_color: "#38bdf8".into(),
                target_version: ">=1.0.0".into(),
            },
            css_content: String::new(),
            config: SkinConfig::default(),
            preview_data_url: None,
            is_builtin: true,
            source_path: None,
            tokens,
        }
    }

    #[test]
    fn kernel_covers_live_workbuddy_selectors() {
        for needle in [
            ".conversation-sidebar",
            ".main-content",
            ".chat-container",
            ".sidebar-next",
            ".main-layout-wrapper-pc",
            ".knowledge-sidebar-pc",
            "userMessageBubble",
            "assistantMessage",
            "#wb-skin-stage",
            "data-wb-stage",
            "data-wb-scene=\"home\"",
            "gridViewItem",
            ".wb-home-route",
            ".wb-home-route__body",
            ".conversation-page-chrome",
            ".conversation-shell",
        ] {
            assert!(
                KERNEL_CSS.contains(needle),
                "kernel.css missing selector/token {needle}"
            );
        }
    }

    #[test]
    fn compile_embeds_tokens_and_kernel() {
        let mut tokens = SkinTokens::dark("#00f0ff");
        tokens.bg = "#070913".into();
        let payload = compile(
            &sample("builtin-cyberpunk", "dark", Some(tokens)),
            &fixture_paths(),
        )
        .unwrap();
        assert!(payload.css.contains("--wb-bg: #070913"));
        assert!(payload.css.contains("--wb-accent: #00f0ff"));
        assert!(payload.css.contains(".conversation-sidebar"));
        assert!(payload.force_dark);
        assert!(!payload.reset);
    }

    #[test]
    fn jingtian_bundled_assets_exist() {
        let dir =
            std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("skins/jingtian-starlight");
        for name in [
            "assets/wall.webp",
            "assets/jingtian-home.webp",
            "assets/jingtian-chat.webp",
            "theme.css",
        ] {
            assert!(dir.join(name).is_file(), "missing {name}");
        }
    }

    #[test]
    fn jingtian_compiles_light_first_with_home_layout() {
        let paths = fixture_paths();
        let skin = crate::skin::manager::get_builtin_skins(&paths)
            .into_iter()
            .find(|s| s.manifest.id == "jingtian-starlight")
            .expect("jingtian builtin");
        let payload = compile(&skin, &paths).unwrap();
        assert!(!payload.force_dark);
        assert!(payload.css.contains("--wb-color-scheme: light"));
        assert!(!payload.css.contains("padding-bottom: 220px"));
        assert!(payload.css.contains("wb-home-page__main-content"));
        assert!(
            !payload.css.contains("min(36vw, 340px)"),
            "home content must not shrink to leave a portrait gutter"
        );
        assert!(payload.css.contains("wb-portrait-chat"));
        assert!(payload.css.contains("night-owl-assets"));
        assert!(payload.css.contains("linear-gradient"));
        assert!(payload.css.contains("data-wb-native-theme=\"dark\""));
        assert!(!payload.css.contains("[class*=\"promo\"]"));
        assert!(payload.stage.is_some());
        assert!(STAGE_JS.contains("好的，妈妈知道了"));
        assert!(STAGE_JS.contains("wb-home-header__title"));
        assert!(
            payload.css.contains(".wb-home-route"),
            "home route must be punched through so wallpaper and portrait show"
        );
        assert!(
            payload
                .css
                .contains("#wb-skin-portraits {\n  position: fixed;\n  inset: 0;\n  z-index: 0;"),
            "portraits must sit behind #root so text is not covered"
        );
        assert!(
            STAGE_JS.contains("conversation-page-chrome"),
            "scene detection must see the 5.4 conversation chrome"
        );
        assert!(
            STAGE_JS.contains("cr-message-list"),
            "scene detection must see the message list, not default every task to home"
        );
        assert!(
            !payload.css.contains("calc(100% - min(34vw, 380px))"),
            "chat composer must keep native width instead of shrinking for the portrait"
        );
        assert!(
            !payload.css.contains("font-weight: 650"),
            "650 is not a PingFang face; Chromium synthesizes it as a double glyph"
        );
        assert!(
            !payload.css.contains("letter-spacing: -0.03em"),
            "negative tracking collides CJK glyphs on the home title and chips"
        );
        assert!(
            payload.css.contains("font-synthesis: none"),
            "custom font stacks must not synthesize fake CJK bold"
        );
        assert!(
            payload.css.contains("\"SF Pro Text\", \"PingFang SC\""),
            "multi-word font names must be quoted or CJK fallback never attaches"
        );
        assert!(
            payload
                .css
                .contains("html[data-wb-skin=\"jingtian-starlight\"] .wb-home-page-header-pc")
                && payload
                    .css
                    .contains("html[data-wb-skin=\"jingtian-starlight\"] .wb-home-header"),
            "home header frost must be opt-out so nested backdrop-filter does not double-paint text"
        );
        assert!(
            payload
                .css
                .contains("padding-bottom: var(--wb-home-slot-reserve, 220px)"),
            "main-content must keep native playbook reserve or the input footer overlaps the playbooks heading"
        );
        assert!(
            !payload.css.contains("bottom: 16px !important"),
            "must not pin related playbooks over the composer footer"
        );
    }

    #[test]
    fn apply_script_assigns_payload() {
        let payload = compile(
            &sample(
                "builtin-frosted-glass",
                "dark",
                Some(SkinTokens::dark("#38bdf8")),
            ),
            &fixture_paths(),
        )
        .unwrap();
        let js = apply_script(&payload).unwrap();
        assert!(js.contains("window.__WB_SKIN_PAYLOAD"));
        assert!(js.contains("builtin-frosted-glass"));
        assert!(js.contains("wb-skin-stage"));
    }
}
