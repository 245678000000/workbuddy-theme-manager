import { WorkBuddyStatus, Skin, SkinConfig } from '../types/skin';

const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

const MOCK_SKINS: Skin[] = [
  {
    manifest: {
      id: 'builtin-default',
      name: '官方原味 (Stock Native)',
      version: '1.0.0',
      author: 'Tencent WorkBuddy',
      description: '恢复 WorkBuddy 官方原生视觉设计与配色方案',
      themeMode: 'dark',
      accentColor: '#0066FF',
    },
    css_content: '',
    config: { opacity: 1, blur: 0 },
    is_builtin: true,
  },
  {
    manifest: {
      id: 'jingtian-starlight',
      name: '景甜 · STARLIGHT 星蝶光廊',
      version: '1.0.0',
      author: 'Wangnov',
      description: '偶像星蝶浅色陪伴主题：浅色星蝶壁纸透出，主页收紧贴立绘，浅色/深色模式共用一套玻璃控件。',
      themeMode: 'light',
      accentColor: '#7046E8',
    },
    css_content: `
      :root {
        --wb-accent: #7046E8 !important;
        --wb-bg: #E8E4FF !important;
      }
      body { background-color: #E8E4FF !important; }
    `,
    config: { opacity: 0.58, blur: 22, custom_accent: '#7046E8' },
    is_builtin: true,
  },
];

export async function apiGetWorkBuddyStatus(): Promise<WorkBuddyStatus> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<WorkBuddyStatus>('get_workbuddy_status');
  }
  return {
    is_installed: true,
    install_path: '/Applications/WorkBuddy.app',
    is_running: false,
    cdp_connected: false,
    debugging_port: 9333,
  };
}

export async function apiLaunchWorkBuddy(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('launch_workbuddy');
  }
  console.log('[Mock] Launching WorkBuddy with owned CDP session');
}

export async function apiCloseWorkBuddy(): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('close_workbuddy');
  }
  console.log('[Mock] Closing WorkBuddy');
  return 1;
}

export async function apiApplySkin(skinId: string): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('apply_skin', { skinId });
  }
  console.log('[Mock] Applied skin:', skinId);
  return 1;
}

export async function apiApplyRawCss(css: string, themeMode: 'dark' | 'light' | 'auto'): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('apply_raw_css', { css, themeMode });
  }
  console.log('[Mock] Applied raw CSS in', themeMode, 'mode:\n', css);
  return 1;
}

export async function apiGetActiveSkinId(): Promise<string | null> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string | null>('get_active_skin_id');
  }
  return 'jingtian-starlight';
}

export async function apiResetSkin(): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('reset_skin');
  }
  console.log('[Mock] Reset skin to native');
  return 1;
}

export async function apiGetSkins(): Promise<Skin[]> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<Skin[]>('get_skins');
  }
  return MOCK_SKINS;
}

export async function apiSaveCustomSkin(
  skinId: string | null | undefined,
  name: string,
  description: string,
  themeMode: string,
  accentColor: string,
  cssContent: string,
  config: SkinConfig
): Promise<Skin> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<Skin>('save_custom_skin', {
      skinId: skinId || null,
      name,
      description,
      themeMode,
      accentColor,
      cssContent,
      config,
    });
  }
  const newSkin: Skin = {
    manifest: {
      id: skinId || `custom-${Date.now()}`,
      name,
      version: '1.0.0',
      author: 'User Custom',
      description,
      themeMode: themeMode as 'dark' | 'light',
      accentColor,
    },
    css_content: cssContent,
    config,
    is_builtin: false,
  };
  return newSkin;
}

export async function apiDeleteCustomSkin(skinId: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('delete_custom_skin', { skinId });
  }
  console.log('[Mock] Deleted custom skin:', skinId);
}

export async function apiCheckUpdate(customRepo?: string): Promise<import('../types/skin').UpdateInfo> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('check_update', { customRepo });
  }
  console.log('[Mock] Checking update for repo:', customRepo);
  return {
    has_update: false,
    current_version: '1.0.0',
    latest_version: '1.0.0',
  };
}

export async function apiOpenExternalUrl(url: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('open_external_url', { url });
  }
  window.open(url, '_blank');
}
