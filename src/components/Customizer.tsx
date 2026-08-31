import React, { useState, useEffect } from 'react';
import { Skin, SkinConfig } from '../types/skin';
import { X, Eye, Save, Code, Sparkles } from 'lucide-react';
import { buildCustomSkin, previewCustomSkin, type CustomSkinInput } from '../utils/customSkin';

interface CustomizerProps {
  initialSkin: Skin | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyCustom: (css: string, themeMode: 'dark' | 'light') => void;
  onSaveCustom: (name: string, desc: string, mode: string, accent: string, css: string, config: SkinConfig) => void;
  loading: boolean;
}

const PRESET_ACCENTS = [
  '#00f0ff', '#38bdf8', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#b45309'
];

export const Customizer: React.FC<CustomizerProps> = ({
  initialSkin,
  isOpen,
  onClose,
  onApplyCustom,
  onSaveCustom,
  loading,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState('#38bdf8');
  const [opacity, setOpacity] = useState(0.9);
  const [blur, setBlur] = useState(16);
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [customCss, setCustomCss] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (initialSkin) {
      setName(`${initialSkin.manifest.name} (定制版)`);
      setDescription(initialSkin.manifest.description);
      setThemeMode(initialSkin.manifest.themeMode);
      setAccentColor(initialSkin.manifest.accentColor);
      setOpacity(initialSkin.config.opacity ?? 0.9);
      setBlur(initialSkin.config.blur ?? 16);
      setFontFamily(initialSkin.config.font_family ?? 'system-ui');
      setCustomCss(initialSkin.config.custom_css ?? '');
    }
  }, [initialSkin]);

  if (!isOpen) return null;

  const toInput = (): CustomSkinInput => ({
    name,
    description,
    themeMode,
    accentColor,
    opacity,
    blur,
    fontFamily,
    customCss,
  });

  const handleLivePreview = () => {
    const preview = previewCustomSkin(toInput());
    onApplyCustom(preview.css, themeMode);
  };

  const handleSave = () => {
    const built = buildCustomSkin(toInput());
    onSaveCustom(
      name || '我的定制皮肤',
      description || '用户自定义微调皮肤',
      themeMode,
      accentColor,
      built.cssContent,
      built.config
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-slate-100">皮肤高级微调与调色板</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">皮肤名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="例如：赛博深蓝"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">明暗模式基调</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${
                    themeMode === 'dark'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  暗黑模式
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${
                    themeMode === 'light'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  明亮模式
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              核心强调色 (Accent Color)：<span className="font-mono text-indigo-400">{accentColor}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-95 ${
                    accentColor.toLowerCase() === color.toLowerCase()
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                title="自定义拾色器"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-medium">面板透明度 (Opacity)</span>
                <span className="text-indigo-400 font-mono">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.02"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-medium">毛玻璃模糊度 (Blur Filter)</span>
                <span className="text-indigo-400 font-mono">{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">界面与代码字体族</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="system-ui, -apple-system, sans-serif">系统原生默认 (System UI)</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono (极客连字)</option>
              <option value="'Fira Code', monospace">Fira Code (等宽编程)</option>
              <option value="Georgia, serif">Georgia (经典衬线书卷)</option>
              <option value="'PingFang SC', 'Microsoft YaHei', sans-serif">苹方 / 微软雅黑</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 mb-1.5 font-medium"
            >
              <Code className="w-4 h-4" />
              {showCode ? '收起高级自定义 CSS 编辑器' : '展开高级自定义 CSS 编辑器'}
            </button>
            {showCode && (
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                placeholder="/* 可在此直接写入针对 WorkBuddy DOM 的覆写样式 */"
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLivePreview}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all active:scale-95 text-xs"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            即时试穿预览 (Live Preview)
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all active:scale-95 text-xs"
            >
              <Save className="w-4 h-4" />
              保存并持久化到皮肤库
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
