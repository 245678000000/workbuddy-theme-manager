export interface SkinManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  themeMode: 'dark' | 'light' | 'auto';
  accentColor: string;
  targetVersion?: string;
}

export interface SkinConfig {
  opacity: number;
  blur: number;
  custom_accent?: string;
  font_family?: string;
  bg_image_base64?: string;
  custom_css?: string;
}

export interface SkinTokens {
  bg: string;
  surface: string;
  text: string;
  accent: string;
  force_dark: boolean;
}

export interface Skin {
  manifest: SkinManifest;
  css_content: string;
  config: SkinConfig;
  preview_data_url?: string;
  is_builtin: boolean;
  source_path?: string;
  tokens?: SkinTokens;
}

export interface WorkBuddyStatus {
  is_installed: boolean;
  install_path?: string;
  is_running: boolean;
  cdp_connected: boolean;
  debugging_port: number;
  pid?: number;
}

export interface UpdateInfo {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  release_notes?: string;
  release_url?: string;
  download_url?: string;
  published_at?: string;
}
