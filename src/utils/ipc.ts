import { WorkBuddyStatus, Skin, SkinConfig } from '../types/skin';

const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

const MOCK_SKINS: Skin[] = [
  {
    manifest: {
      id: 'jingtian-starlight',
      name: '景甜 · STARLIGHT 星蝶光廊',
      version: '1.2.0',
      author: 'Wangnov',
      description: '偶像星蝶浅色陪伴主题：浅色星蝶壁纸透出，主页收紧贴立绘，浅色/深色模式共用一套玻璃控件。',
      themeMode: 'light',
      accentColor: '#7046E8',
    },
    css_content: `
      :root {
        --wb-accent: #7046E8 !important;
        --wb-bg: #151336 !important;
      }
      body { background-color: #151336 !important; }
    `,
    config: { opacity: 0.88, blur: 24, custom_accent: '#7046E8' },
    is_builtin: false,
  },
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
      id: 'builtin-cyberpunk',
      name: '赛博霓虹 (Cyberpunk Neon)',
      version: '1.0.0',
      author: 'Antigravity',
      description: '高对比度深黑底色，融合青荧与紫粉霓虹微光',
      themeMode: 'dark',
      accentColor: '#00f0ff',
    },
    css_content: `
      :root {
        --bg-primary: #070913 !important;
        --accent-color: #00f0ff !important;
      }
      body { background-color: #070913 !important; }
    `,
    config: { opacity: 0.92, blur: 16, custom_accent: '#00f0ff' },
    is_builtin: true,
  },
  {
    manifest: {
      id: 'builtin-frosted-glass',
      name: '深空毛玻璃 (Frosted Glass)',
      version: '1.0.0',
      author: 'Antigravity',
      description: '现代透亮毛玻璃质感，精致半透明层次与柔和环境光',
      themeMode: 'dark',
      accentColor: '#38bdf8',
    },
    css_content: `
      :root {
        --bg-primary: #0b0f19 !important;
        --accent-color: #38bdf8 !important;
      }
    `,
    config: { opacity: 0.85, blur: 20, custom_accent: '#38bdf8' },
    is_builtin: true,
  },
  {
    manifest: {
      id: 'builtin-parchment',
      name: '温润羊皮纸 (Warm Parchment)',
      version: '1.0.0',
      author: 'Antigravity',
      description: '柔和米黄低疲劳护眼阅读体验，经典书卷质感',
      themeMode: 'light',
      accentColor: '#b45309',
    },
    css_content: `
      :root {
        --bg-primary: #fbf7ee !important;
        --accent-color: #b45309 !important;
      }
    `,
    config: { opacity: 1, blur: 0, custom_accent: '#b45309' },
    is_builtin: true,
  },
  {
    manifest: {
      id: 'builtin-vscode-dark',
      name: 'VS Code 极客暗黑 (Dark+ Pro)',
      version: '1.0.0',
      author: 'Antigravity',
      description: '经典开发者暗黑灰度基调与纯净代码工坊氛围',
      themeMode: 'dark',
      accentColor: '#007acc',
    },
    css_content: `
      :root {
        --bg-primary: #1e1e1e !important;
        --accent-color: #007acc !important;
      }
    `,
    config: { opacity: 1, blur: 0, custom_accent: '#007acc' },
    is_builtin: true,
  },
];

export async function apiGetWorkBuddyStatus(port?: number): Promise<WorkBuddyStatus> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<WorkBuddyStatus>('get_workbuddy_status', { port });
  }
  return {
    is_installed: true,
    install_path: '/Applications/WorkBuddy.app',
    is_running: false,
    cdp_connected: false,
    debugging_port: 9222,
  };
}

export async function apiLaunchWorkBuddy(port?: number): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('launch_workbuddy', { port });
  }
  console.log('[Mock] Launching WorkBuddy with CDP port:', port);
}

export async function apiCloseWorkBuddy(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('close_workbuddy');
  }
  console.log('[Mock] Closing WorkBuddy');
}

export async function apiApplySkin(skinId: string, port?: number): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('apply_skin', { skinId, port });
  }
  console.log('[Mock] Applied skin:', skinId);
  return 1;
}

export async function apiApplyRawCss(css: string, port?: number): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('apply_raw_css', { css, port });
  }
  console.log('[Mock] Applied raw CSS:\n', css);
  return 1;
}

export async function apiGetActiveSkinId(): Promise<string | null> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string | null>('get_active_skin_id');
  }
  return 'jingtian-starlight';
}

export async function apiResetSkin(port?: number): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number>('reset_skin', { port });
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
      id: `custom-${Date.now()}`,
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
