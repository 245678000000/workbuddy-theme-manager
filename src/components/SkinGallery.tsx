import React, { useState } from 'react';
import { Skin } from '../types/skin';
import { SkinCard } from './SkinCard';
import { Search, Plus, Palette, Moon, Sun, User } from 'lucide-react';

interface SkinGalleryProps {
  skins: Skin[];
  activeSkinId: string | null;
  onApplySkin: (skin: Skin) => void;
  onCustomizeSkin: (skin: Skin) => void;
  onDeleteSkin: (skinId: string) => void;
  onCreateNew: () => void;
  loading: boolean;
}

export const SkinGallery: React.FC<SkinGalleryProps> = ({
  skins,
  activeSkinId,
  onApplySkin,
  onCustomizeSkin,
  onDeleteSkin,
  onCreateNew,
  loading,
}) => {
  const [filter, setFilter] = useState<'all' | 'dark' | 'light' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkins = skins.filter((skin) => {
    // 模式筛选
    if (filter === 'dark' && skin.manifest.themeMode !== 'dark') return false;
    if (filter === 'light' && skin.manifest.themeMode !== 'light') return false;
    if (filter === 'custom' && skin.is_builtin) return false;

    // 搜索筛选
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        skin.manifest.name.toLowerCase().includes(q) ||
        skin.manifest.description.toLowerCase().includes(q) ||
        skin.manifest.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 顶部搜索与分类过滤 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 筛选选项卡 */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            全部 ({skins.length})
          </button>
          <button
            onClick={() => setFilter('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            暗黑
          </button>
          <button
            onClick={() => setFilter('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'light'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            明亮
          </button>
          <button
            onClick={() => setFilter('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            我的定制
          </button>
        </div>

        {/* 搜索框与新建按钮 */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索皮肤名称或作者..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium shadow-md shadow-indigo-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            新建皮肤
          </button>
        </div>
      </div>

      {/* 皮肤卡片网格 */}
      {filteredSkins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkins.map((skin) => (
            <SkinCard
              key={skin.manifest.id}
              skin={skin}
              isActive={activeSkinId === skin.manifest.id}
              onApply={onApplySkin}
              onCustomize={onCustomizeSkin}
              onDelete={onDeleteSkin}
              loading={loading}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
          <Palette className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">未找到匹配的皮肤</h4>
          <p className="text-xs text-slate-500 mt-1">可以尝试更换关键词或点击上方按钮创建新皮肤</p>
        </div>
      )}
    </div>
  );
};
