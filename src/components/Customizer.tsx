import React, { useState, useEffect, useRef } from 'react';
import { Skin, SkinConfig } from '../types/skin';
import { X, Eye, Save, Code, Sparkles, Image as ImageIcon, Trash2, Copy } from 'lucide-react';
import { buildCustomSkin, previewCustomSkin, type CustomSkinInput } from '../utils/customSkin';

interface CustomizerProps {
  initialSkin: Skin | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyCustom: (css: string, themeMode: 'dark' | 'light' | 'auto') => void;
  onSaveCustom: (
    skinId: string | null,
    name: string,
    desc: string,
    mode: string,
    accent: string,
    css: string,
    config: SkinConfig
  ) => void;
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
  const [editingSkinId, setEditingSkinId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'auto'>('dark');
  const [accentColor, setAccentColor] = useState('#38bdf8');
  const [opacity, setOpacity] = useState(0.9);
  const [blur, setBlur] = useState(16);
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [customCss, setCustomCss] = useState('');
  const [bgImageBase64, setBgImageBase64] = useState<string | undefined>(undefined);
  const [showCode, setShowCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSkin) {
      const isCustom = !initialSkin.is_builtin;
      setEditingSkinId(isCustom ? initialSkin.manifest.id : null);
      setName(isCustom ? initialSkin.manifest.name : `${initialSkin.manifest.name} (定制版)`);
      setDescription(initialSkin.manifest.description);
      setThemeMode(initialSkin.manifest.themeMode);
      setAccentColor(initialSkin.manifest.accentColor);
      setOpacity(initialSkin.config.opacity ?? 0.9);
      setBlur(initialSkin.config.blur ?? 16);
      setFontFamily(initialSkin.config.font_family ?? 'system-ui');
      setCustomCss(initialSkin.config.custom_css ?? '');
      setBgImageBase64(initialSkin.config.bg_image_base64);
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
    bgImageBase64,
  });

  const handleLivePreview = () => {
    const preview = previewCustomSkin(toInput());
    onApplyCustom(preview.css, themeMode);
  };

  const handleSave = (asNew: boolean = false) => {
    const built = buildCustomSkin(toInput());
    const targetId = asNew ? null : editingSkinId;
    onSaveCustom(
      targetId,
      name || '我的定制皮肤',
      description || '用户自定义微调皮肤',
      themeMode,
      accentColor,
      built.cssContent,
      built.config
    );
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('壁纸图片大小建议不超过 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBgImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const isEditingExistingCustom = Boolean(editingSkinId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 border-slate-200 dark:bg-slate-950/40 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-base dark:text-slate-100 text-slate-900">
              {isEditingExistingCustom ? '编辑自定义皮肤' : '新建与微调定制皮肤'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5">皮肤名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:text-slate-100 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                placeholder="例如：赛博深蓝"
              />
            </div>
            <div>
              <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5">明暗模式基调</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${
                    themeMode === 'dark'
                      ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                      : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600'
                  }`}
                >
                  暗黑模式
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${
                    themeMode === 'light'
                      ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                      : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600'
                  }`}
                >
                  明亮模式
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('auto')}
                  className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${
                    themeMode === 'auto'
                      ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                      : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600'
                  }`}
                >
                  跟随系统
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5">
              核心强调色 (Accent Color)：<span className="font-mono text-indigo-500 dark:text-indigo-400">{accentColor}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-95 ${
                    accentColor.toLowerCase() === color.toLowerCase()
                      ? 'border-indigo-600 scale-110 shadow-lg'
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

          <div className="grid grid-cols-2 gap-4 dark:bg-slate-950/60 bg-slate-50 p-4 rounded-xl border dark:border-slate-800 border-slate-200">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="dark:text-slate-300 text-slate-700 font-medium">面板透明度 (Opacity)</span>
                <span className="text-indigo-500 dark:text-indigo-400 font-mono">{Math.round(opacity * 100)}%</span>
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
                <span className="dark:text-slate-300 text-slate-700 font-medium">毛玻璃模糊度 (Blur Filter)</span>
                <span className="text-indigo-500 dark:text-indigo-400 font-mono">{blur}px</span>
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

          {/* 自定义背景壁纸设置 */}
          <div className="dark:bg-slate-950/60 bg-slate-50 p-4 rounded-xl border dark:border-slate-800 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="dark:text-slate-300 text-slate-700 font-medium flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                自定义背景壁纸 (Wallpaper)
              </label>
              {bgImageBase64 && (
                <button
                  type="button"
                  onClick={() => setBgImageBase64(undefined)}
                  className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  移除壁纸
                </button>
              )}
            </div>

            {bgImageBase64 ? (
              <div className="relative rounded-lg overflow-hidden h-24 border dark:border-slate-700 border-slate-200 group">
                <img
                  src={bgImageBase64}
                  alt="壁纸预览"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" /> 更换图片
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border border-dashed dark:border-slate-700 border-slate-300 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center gap-1 dark:text-slate-400 text-slate-500 hover:text-indigo-600 transition-colors dark:bg-slate-900/30 bg-white"
              >
                <ImageIcon className="w-5 h-5 text-slate-400" />
                <span>点击上传背景壁纸图片 (WebP / PNG / JPG)</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/webp,image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div>
            <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5">界面与代码字体族</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:text-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
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
              className="flex items-center gap-1.5 dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 mb-1.5 font-medium"
            >
              <Code className="w-4 h-4" />
              {showCode ? '收起高级自定义 CSS 编辑器' : '展开高级自定义 CSS 编辑器'}
            </button>
            {showCode && (
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-lg dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:text-slate-200 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                placeholder="/* 可在此直接写入针对 WorkBuddy DOM 的覆写样式 */"
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t dark:border-slate-800 border-slate-200 dark:bg-slate-950/60 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLivePreview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 text-slate-700 border dark:border-transparent border-slate-200 font-medium shadow-sm transition-all active:scale-95 text-xs shrink-0"
          >
            <Eye className="w-4 h-4 text-indigo-500" />
            即时试穿预览
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-600 border dark:border-transparent border-slate-200 font-medium text-xs shadow-sm"
            >
              取消
            </button>

            {isEditingExistingCustom ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 text-slate-700 border dark:border-transparent border-slate-200 font-medium shadow-sm transition-all active:scale-95 text-xs"
                  title="以此为基础保存为新的一份皮肤"
                >
                  <Copy className="w-3.5 h-3.5" />
                  另存为新皮肤
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all active:scale-95 text-xs"
                >
                  <Save className="w-4 h-4" />
                  保存修改
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all active:scale-95 text-xs"
              >
                <Save className="w-4 h-4" />
                保存并添加到皮肤库
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
