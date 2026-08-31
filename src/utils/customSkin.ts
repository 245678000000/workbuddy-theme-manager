import { SkinConfig } from '../types/skin';

export interface CustomSkinInput {
  name: string;
  description: string;
  themeMode: 'dark' | 'light';
  accentColor: string;
  opacity: number;
  blur: number;
  fontFamily: string;
  customCss: string;
}

export interface CustomSkinResult {
  cssContent: string;
  config: SkinConfig;
  forceDark: boolean;
}

export function buildCustomSkin(input: CustomSkinInput): CustomSkinResult {
  const isDark = input.themeMode === 'dark';
  const bgBase = isDark ? '#0b0f19' : '#f8fafc';
  const textBase = isDark ? '#f8fafc' : '#0f172a';
  const cssContent = `
      :root {
        --wb-accent: ${input.accentColor} !important;
        --wb-bg: ${bgBase} !important;
        --wb-text: ${textBase} !important;
        --wb-font: ${input.fontFamily} !important;
        --wb-blur: ${input.blur}px !important;
        --wb-panel-opacity: ${input.opacity} !important;
      }
      body, .app-container, #root, .main-content, .chat-container {
        font-family: ${input.fontFamily} !important;
        background-color: ${bgBase} !important;
        color: ${textBase} !important;
      }
      .conversation-sidebar, .sidebar-next, .main-content, .chat-container {
        backdrop-filter: blur(${input.blur}px) !important;
        -webkit-backdrop-filter: blur(${input.blur}px) !important;
        opacity: ${input.opacity} !important;
      }
      button.primary, .btn-primary, [data-primary="true"] {
        background-color: ${input.accentColor} !important;
        color: ${isDark ? '#000000' : '#ffffff'} !important;
      }
    `;

  return {
    cssContent,
    config: {
      opacity: input.opacity,
      blur: input.blur,
      custom_accent: input.accentColor,
      font_family: input.fontFamily,
      custom_css: input.customCss,
    },
    forceDark: isDark,
  };
}

export function previewCustomSkin(input: CustomSkinInput): { css: string; forceDark: boolean } {
  const built = buildCustomSkin(input);
  const extra = input.customCss.trim();
  return {
    css: extra ? `${built.cssContent}\n${extra}\n` : built.cssContent,
    forceDark: built.forceDark,
  };
}
