import React from 'react';
import { Skin } from '../types/skin';
import { Check, Sparkles, Trash2, Sliders } from 'lucide-react';

interface SkinCardProps {
  skin: Skin;
  isActive: boolean;
  onApply: (skin: Skin) => void;
  onCustomize: (skin: Skin) => void;
  onDelete?: (skinId: string) => void;
  loading: boolean;
}

export const SkinCard: React.FC<SkinCardProps> = ({
  skin,
  isActive,
  onApply,
  onCustomize,
  onDelete,
  loading,
}) => {
  const { manifest, config } = skin;

  // 根据皮肤生成模拟预览卡片的颜色
  const getPreviewBg = () => {
    if (manifest.id === 'jingtian-starlight') return 'from-[#E8E4FF] to-[#F7F3FF]';
    if (manifest.id === 'builtin-cyberpunk') return 'from-[#070913] to-[#131b36]';
    if (manifest.id === 'builtin-frosted-glass') return 'from-[#0f172a] to-[#1e293b]';
    if (manifest.id === 'builtin-parchment') return 'from-[#fbf7ee] to-[#f4ecdc]';
    if (manifest.id === 'builtin-vscode-dark') return 'from-[#1e1e1e] to-[#252526]';
    return 'from-slate-900 to-slate-800';
  };

  const isLight = manifest.themeMode === 'light';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isActive
          ? 'bg-slate-900/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50'
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
      }`}
    >
      {/* 顶部微缩视觉预览区域 */}
      <div className={`h-28 w-full bg-gradient-to-br ${getPreviewBg()} p-3 relative overflow-hidden flex flex-col justify-between border-b border-slate-800/50`}>
        {/* 模拟 WorkBuddy UI 元素 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
            style={{
              backgroundColor: `${manifest.accentColor}20`,
              color: manifest.accentColor,
              border: `1px solid ${manifest.accentColor}40`,
            }}
          >
            {manifest.accentColor}
          </span>
        </div>

        {/* 模拟聊天气泡 */}
        <div className="flex flex-col gap-1.5">
          <div
            className={`w-3/4 h-3.5 rounded px-2 text-[8px] flex items-center shadow-sm ${
              isLight ? 'bg-white/80 text-slate-800' : 'bg-slate-800/70 text-slate-200'
            }`}
            style={{
              backdropFilter: `blur(${config.blur || 4}px)`,
              opacity: config.opacity || 1,
            }}
          >
            你好，我是 WorkBuddy...
          </div>
          <div
            className="w-1/2 h-3.5 rounded self-end px-2 text-[8px] flex items-center font-medium shadow-sm"
            style={{
              backgroundColor: manifest.accentColor,
              color: isLight ? '#ffffff' : '#000000',
            }}
          >
            帮我整理今日事项
          </div>
        </div>

        {/* 当前选中徽标 */}
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold shadow-md">
            <Check className="w-3 h-3" /> 已应用
          </div>
        )}
      </div>

      {/* 底部信息与操作区 */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-slate-100 truncate">
              {manifest.name}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {manifest.themeMode === 'dark' ? '暗黑' : '明亮'}
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
            {manifest.description}
          </p>
          <div className="text-[11px] text-slate-500 mt-2">
            作者：<span className="text-slate-400">{manifest.author}</span> · v{manifest.version}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => onApply(skin)}
            disabled={loading}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isActive
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isActive ? '重新注入' : '一键应用'}
          </button>

          <button
            onClick={() => onCustomize(skin)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="基于此皮肤进行二次定制与微调"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {!skin.is_builtin && onDelete && (
            <button
              onClick={() => onDelete(manifest.id)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              title="删除自定义皮肤"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
