use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkinManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    #[serde(rename = "themeMode")]
    pub theme_mode: String, // "dark" | "light"
    #[serde(rename = "accentColor")]
    pub accent_color: String,
    #[serde(rename = "targetVersion", default)]
    pub target_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SkinConfig {
    pub opacity: f32,
    pub blur: u32,
    pub custom_accent: Option<String>,
    pub font_family: Option<String>,
    pub bg_image_base64: Option<String>,
    pub custom_css: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkinTokens {
    pub bg: String,
    pub surface: String,
    pub text: String,
    pub text_muted: String,
    pub accent: String,
    pub border: String,
    pub panel_opacity: f32,
    pub blur: u32,
    pub chat_bg: String,
    pub main_opacity: f32,
    pub bubble_user: String,
    pub bubble_user_text: String,
    pub bubble_assistant: String,
    pub bubble_assistant_text: String,
    pub force_dark: bool,
    pub color_scheme: String,
    #[serde(default)]
    pub font_family: Option<String>,
    #[serde(default)]
    pub bg_image: Option<String>,
    #[serde(default)]
    pub portrait_shadow: Option<String>,
}

impl SkinTokens {
    pub fn dark(accent: &str) -> Self {
        Self {
            bg: "#0b0f19".into(),
            surface: "#111827".into(),
            text: "#f8fafc".into(),
            text_muted: "#94a3b8".into(),
            accent: accent.to_string(),
            border: "rgba(148, 163, 184, 0.22)".into(),
            panel_opacity: 0.82,
            blur: 16,
            chat_bg: "#0b0f19".into(),
            main_opacity: 0.78,
            bubble_user: accent.to_string(),
            bubble_user_text: "#0b1220".into(),
            bubble_assistant: "rgba(15, 23, 42, 0.86)".into(),
            bubble_assistant_text: "#f8fafc".into(),
            force_dark: true,
            color_scheme: "dark".into(),
            font_family: None,
            bg_image: None,
            portrait_shadow: None,
        }
    }

    pub fn light(accent: &str) -> Self {
        Self {
            bg: "#f8fafc".into(),
            surface: "#ffffff".into(),
            text: "#0f172a".into(),
            text_muted: "#64748b".into(),
            accent: accent.to_string(),
            border: "rgba(15, 23, 42, 0.12)".into(),
            panel_opacity: 1.0,
            blur: 0,
            chat_bg: "#f8fafc".into(),
            main_opacity: 1.0,
            bubble_user: accent.to_string(),
            bubble_user_text: "#ffffff".into(),
            bubble_assistant: "#ffffff".into(),
            bubble_assistant_text: "#0f172a".into(),
            force_dark: false,
            color_scheme: "light".into(),
            font_family: None,
            bg_image: None,
            portrait_shadow: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skin {
    pub manifest: SkinManifest,
    pub css_content: String,
    pub config: SkinConfig,
    pub preview_data_url: Option<String>,
    pub is_builtin: bool,
    pub source_path: Option<String>,
    #[serde(default)]
    pub tokens: Option<SkinTokens>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkBuddyStatus {
    pub is_installed: bool,
    pub install_path: Option<String>,
    pub is_running: bool,
    pub cdp_connected: bool,
    pub debugging_port: u16,
    pub pid: Option<u32>,
}
