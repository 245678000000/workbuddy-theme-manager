import React, { useState, useEffect, useCallback } from 'react';
import { Header, type AppTheme } from './components/Header';
import { SkinGallery } from './components/SkinGallery';
import { Customizer } from './components/Customizer';
import { UpdateModal } from './components/UpdateModal';
import { Skin, SkinConfig, WorkBuddyStatus, UpdateInfo } from './types/skin';
import {
  apiGetWorkBuddyStatus,
  apiLaunchWorkBuddy,
  apiCloseWorkBuddy,
  apiApplySkin,
  apiApplyRawCss,
  apiResetSkin,
  apiGetSkins,
  apiGetActiveSkinId,
  apiSaveCustomSkin,
  apiDeleteCustomSkin,
  apiCheckUpdate,
} from './utils/ipc';
import { CheckCircle2, AlertCircle, Info, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('wb-app-theme') as AppTheme) || 'system';
  });
  const [status, setStatus] = useState<WorkBuddyStatus | null>(null);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [activeSkinId, setActiveSkinId] = useState<string | null>(null);
  const [customizingSkin, setCustomizingSkin] = useState<Skin | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 监听并应用软件自身深浅色主题
  useEffect(() => {
    localStorage.setItem('wb-app-theme', appTheme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isDark = appTheme === 'dark' || (appTheme === 'system' && mediaQuery.matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [appTheme]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshStatus = useCallback(async () => {
    try {
      const res = await apiGetWorkBuddyStatus();
      setStatus(res);
    } catch (e) {
      console.error('获取状态失败', e);
    }
  }, []);

  const refreshSkins = useCallback(async () => {
    try {
      const list = await apiGetSkins();
      setSkins(list);
    } catch (e) {
      console.error('获取皮肤列表失败', e);
    }
  }, []);

  const checkUpdates = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        showToast('正在检查 GitHub 最新版本更新...', 'info');
      }
      const info = await apiCheckUpdate();
      setUpdateInfo(info);
      if (info.has_update) {
        setIsUpdateModalOpen(true);
        if (isManual) {
          showToast(`发现新版本 ${info.latest_version} 可用！`, 'success');
        }
      } else if (isManual) {
        showToast(`当前已是最新版本 (v${info.current_version})`, 'success');
      }
    } catch (e) {
      if (isManual) {
        showToast(`检查更新失败: ${e}`, 'error');
      }
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshSkins();
    apiGetActiveSkinId()
      .then((id) => {
        if (id) setActiveSkinId(id);
      })
      .catch(() => {});

    // 启动后 3 秒静默检查一次 GitHub 更新
    const updateTimer = setTimeout(() => checkUpdates(false), 3000);
    const timer = setInterval(refreshStatus, 3000);
    return () => {
      clearTimeout(updateTimer);
      clearInterval(timer);
    };
  }, [refreshStatus, refreshSkins, checkUpdates]);

  const wasCdpConnected = React.useRef(false);
  useEffect(() => {
    const connected = !!status?.cdp_connected;
    const rose = connected && !wasCdpConnected.current;
    wasCdpConnected.current = connected;
    if (
      rose &&
      activeSkinId &&
      activeSkinId !== 'builtin-default'
    ) {
      apiApplySkin(activeSkinId).catch((e) => {
        console.error('重连后自动注入失败', e);
      });
    }
  }, [status?.cdp_connected, activeSkinId]);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      await apiLaunchWorkBuddy();
      showToast('正在启动 WorkBuddy 并开启 CDP 调试通道...', 'info');
      setTimeout(refreshStatus, 2000);
    } catch (e) {
      showToast(`启动失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      const closed = await apiCloseWorkBuddy();
      showToast(
        closed > 0 ? `已安全关闭 ${closed} 个 WorkBuddy 进程` : '未发现可安全关闭的 WorkBuddy 进程',
        'info'
      );
      setTimeout(refreshStatus, 1000);
    } catch (e) {
      showToast(`关闭失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySkin = async (skin: Skin) => {
    setLoading(true);
    try {
      if (skin.manifest.id === 'builtin-default') {
        await apiResetSkin();
        setActiveSkinId('builtin-default');
        showToast('已还原为官方原生外观', 'success');
      } else {
        await apiApplySkin(skin.manifest.id);
        setActiveSkinId(skin.manifest.id);
        showToast(`已成功注入并应用皮肤「${skin.manifest.name}」`, 'success');
      }
    } catch (e) {
      showToast(`注入失败: ${e}（请确认 WorkBuddy 是否已启动并接入调试端口）`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await apiResetSkin();
      setActiveSkinId('builtin-default');
      showToast('已清空全部自定义样式，安全还原原生界面', 'success');
    } catch (e) {
      showToast(`还原失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomizer = (skin: Skin) => {
    setCustomizingSkin(skin);
    setIsCustomizerOpen(true);
  };

  const handleCreateNew = () => {
    const templateSkin = skins.find((s) => s.manifest.id === 'jingtian-starlight') || skins[0];
    setCustomizingSkin(templateSkin);
    setIsCustomizerOpen(true);
  };

  const handleApplyCustom = async (css: string, themeMode: 'dark' | 'light' | 'auto') => {
    setLoading(true);
    try {
      await apiApplyRawCss(css, themeMode);
      showToast('已在 WorkBuddy 中实时预览微调效果', 'info');
    } catch (e) {
      showToast(`实时预览注入失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustom = async (
    skinId: string | null,
    name: string,
    desc: string,
    mode: string,
    accent: string,
    css: string,
    config: SkinConfig
  ) => {
    setLoading(true);
    try {
      const saved = await apiSaveCustomSkin(skinId, name, desc, mode, accent, css, config);
      await refreshSkins();
      try {
        await apiApplySkin(saved.manifest.id);
        setActiveSkinId(saved.manifest.id);
        showToast(
          skinId ? `皮肤「${name}」已成功更新并应用` : `皮肤「${name}」已成功创建并应用`,
          'success'
        );
      } catch (applyErr) {
        showToast(`皮肤已保存，但应用失败：${applyErr}`, 'error');
      }
    } catch (e) {
      showToast(`保存皮肤失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustom = async (skinId: string) => {
    if (!confirm('确定要删除该自定义皮肤吗？')) return;
    setLoading(true);
    try {
      await apiDeleteCustomSkin(skinId);
      await refreshSkins();
      if (activeSkinId === skinId) {
        handleReset();
      }
      showToast('皮肤已从本地库移除', 'info');
    } catch (e) {
      showToast(`删除失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 selection:bg-indigo-500 selection:text-white transition-colors">
      <Header
        status={status}
        onLaunch={handleLaunch}
        onClose={handleClose}
        onReset={handleReset}
        loading={loading}
        appTheme={appTheme}
        onAppThemeChange={setAppTheme}
        onCheckUpdate={() => checkUpdates(true)}
        hasUpdate={Boolean(updateInfo?.has_update)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div className="p-4 rounded-2xl dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/60 dark:border-indigo-500/20 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white/90 border border-indigo-200/70 flex items-start gap-3.5 backdrop-blur-md shadow-sm">
          <div className="p-2 rounded-xl dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/20 border-indigo-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-semibold dark:text-slate-200 text-slate-800 flex items-center gap-2">
              如何使用 WorkBuddy 皮肤换肤？
            </div>
            <p className="dark:text-slate-400 text-slate-600 leading-relaxed">
              1. 点击右上角「<strong>启动 WorkBuddy</strong>」，管理器将以安全调试端口模式启动客户端；<br />
              2. 在下方画廊中挑选心仪的主题，点击「<strong>一键应用</strong>」，样式将实时注入 WorkBuddy，无需重启；<br />
              3. 支持点击卡片右下角的调节图标进行<strong>二次微调与强调色定制</strong>，随时点击「安全还原原生」一键恢复。
            </p>
          </div>
        </div>

        <SkinGallery
          skins={skins}
          activeSkinId={activeSkinId}
          onApplySkin={handleApplySkin}
          onCustomizeSkin={handleOpenCustomizer}
          onDeleteSkin={handleDeleteCustom}
          onCreateNew={handleCreateNew}
          loading={loading}
        />
      </main>

      <footer className="py-3 text-center text-[11px] dark:text-slate-500 text-slate-400 border-t dark:border-slate-900 border-slate-200 dark:bg-slate-950/80 bg-white/80 transition-colors">
        WorkBuddy Skin Manager
      </footer>

      <Customizer
        initialSkin={customizingSkin}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onApplyCustom={handleApplyCustom}
        onSaveCustom={handleSaveCustom}
        loading={loading}
      />

      <UpdateModal
        updateInfo={updateInfo}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-500/30 bg-emerald-50 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-500/30 bg-rose-50 text-rose-900 border-rose-300 shadow-rose-500/10'
                : 'dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-700 bg-white text-slate-800 border-slate-200 shadow-slate-300/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
