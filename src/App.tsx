import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SkinGallery } from './components/SkinGallery';
import { Customizer } from './components/Customizer';
import { Skin, SkinConfig, WorkBuddyStatus } from './types/skin';
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
} from './utils/ipc';
import { CheckCircle2, AlertCircle, Info, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [status, setStatus] = useState<WorkBuddyStatus | null>(null);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [activeSkinId, setActiveSkinId] = useState<string | null>(null);
  const [customizingSkin, setCustomizingSkin] = useState<Skin | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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

  useEffect(() => {
    refreshStatus();
    refreshSkins();
    apiGetActiveSkinId()
      .then((id) => {
        if (id) setActiveSkinId(id);
      })
      .catch(() => {});

    const timer = setInterval(refreshStatus, 3000);
    return () => clearInterval(timer);
  }, [refreshStatus, refreshSkins]);

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
      await apiCloseWorkBuddy();
      showToast('已关闭 WorkBuddy 进程', 'info');
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
    const templateSkin = skins.find((s) => s.manifest.id === 'builtin-frosted-glass') || skins[0];
    setCustomizingSkin(templateSkin);
    setIsCustomizerOpen(true);
  };

  const handleApplyCustom = async (css: string) => {
    setLoading(true);
    try {
      await apiApplyRawCss(css);
      showToast('已在 WorkBuddy 中实时预览微调效果', 'info');
    } catch (e) {
      showToast(`实时预览注入失败: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustom = async (
    name: string,
    desc: string,
    mode: string,
    accent: string,
    css: string,
    config: SkinConfig
  ) => {
    setLoading(true);
    try {
      const created = await apiSaveCustomSkin(name, desc, mode, accent, css, config);
      await refreshSkins();
      try {
        await apiApplySkin(created.manifest.id);
      } catch (applyErr) {
        console.error('保存后应用失败', applyErr);
      }
      setActiveSkinId(created.manifest.id);
      showToast(`皮肤「${name}」已成功保存并应用`, 'success');
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Header
        status={status}
        onLaunch={handleLaunch}
        onClose={handleClose}
        onReset={handleReset}
        loading={loading}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/20 flex items-start gap-3.5 backdrop-blur-md">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              如何使用 WorkBuddy 皮肤换肤？
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. 点击右上角「<strong>启动 WorkBuddy</strong>」，管理器将以安全调试端口模式启动客户端；<br />
              2. 在下方画廊中挑选心仪的主题，点击「<strong>一键应用</strong>」，样式将实时注入 WorkBuddy，无需重启；<br />
              3. 支持点击卡片右下角的调节图标进行<strong>二次微调与壁纸/强调色定制</strong>，随时点击「安全还原原生」一键恢复。
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

      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950/80">
        WorkBuddy Skin Manager · 基于 Tauri v2 与 CDP 协议构建 · 零文件修改
      </footer>

      <Customizer
        initialSkin={customizingSkin}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onApplyCustom={handleApplyCustom}
        onSaveCustom={handleSaveCustom}
        loading={loading}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-500/10'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-black/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
