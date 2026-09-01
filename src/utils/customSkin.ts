import { SkinConfig } from '../types/skin';

export interface CustomSkinInput {
  name: string;
  description: string;
  themeMode: 'dark' | 'light' | 'auto';
  accentColor: string;
  opacity: number;
  blur: number;
  fontFamily: string;
  customCss: string;
  bgImageBase64?: string;
}

export interface CustomSkinResult {
  cssContent: string;
  config: SkinConfig;
  forceDark: boolean;
}

export function buildCustomSkin(input: CustomSkinInput): CustomSkinResult {
  const isDark = input.themeMode === 'dark';
  const bgBase = isDark ? '#0b0f19' : '#f8fafc';
  const surfaceBase = isDark ? '#0f172a' : '#ffffff';
  const textBase = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderBase = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 23, 42, 0.12)';
  const bubbleUser = input.accentColor;
  const bubbleUserText = isDark ? '#0b1220' : '#ffffff';
  const bubbleAssistant = isDark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.9)';
  const bubbleAssistantText = textBase;
  const bgImageValue = input.bgImageBase64
    ? `url("${input.bgImageBase64.startsWith('data:') ? input.bgImageBase64 : `data:image/webp;base64,${input.bgImageBase64}`}")`
    : 'none';

  const cssContent = `
      :root {
        --wb-accent: ${input.accentColor} !important;
        --wb-bg: ${bgBase} !important;
        --wb-surface: ${surfaceBase} !important;
        --wb-text: ${textBase} !important;
        --wb-text-muted: ${textMuted} !important;
        --wb-border: ${borderBase} !important;
        --wb-font: ${input.fontFamily} !important;
        --wb-blur: ${input.blur}px !important;
        --wb-panel-opacity: ${input.opacity} !important;
        --wb-chat-bg: ${bgBase} !important;
        --wb-main-opacity: ${Math.max(0.4, input.opacity - 0.04)} !important;
        --wb-bubble-user: ${bubbleUser} !important;
        --wb-bubble-user-text: ${bubbleUserText} !important;
        --wb-bubble-assistant: ${bubbleAssistant} !important;
        --wb-bubble-assistant-text: ${bubbleAssistantText} !important;
        --wb-color-scheme: ${input.themeMode} !important;
        --wb-bg-image: ${bgImageValue} !important;
      }
      body, .app-container, #root, .main-content, .chat-container {
        font-family: ${input.fontFamily} !important;
        background-color: ${bgBase} !important;
        color: ${textBase} !important;
      }
      .conversation-sidebar, .sidebar-next, .main-content, .chat-container, .knowledge-sidebar-pc {
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
      bg_image_base64: input.bgImageBase64,
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
