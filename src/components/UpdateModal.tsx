import React from 'react';
import { UpdateInfo } from '../types/skin';
import { Sparkles, Download, ExternalLink, X, Calendar, ArrowRight } from 'lucide-react';
import { apiOpenExternalUrl } from '../utils/ipc';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !updateInfo || !updateInfo.has_update) return null;

  const handleDownload = () => {
    const targetUrl = updateInfo.download_url || updateInfo.release_url;
    if (targetUrl) {
      apiOpenExternalUrl(targetUrl);
    }
  };

  const handleOpenReleasePage = () => {
    if (updateInfo.release_url) {
      apiOpenExternalUrl(updateInfo.release_url);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部标题区 */}
        <div className="relative px-6 pt-6 pb-4 border-b dark:border-slate-800 border-slate-200 dark:bg-gradient-to-r dark:from-indigo-950/40 dark:to-purple-950/40 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">
                  发现新版本可用
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span>当前版本: v{updateInfo.current_version}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                    最新版本: {updateInfo.latest_version}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 中间更新日志内容区 */}
        <div className="p-6 space-y-4 text-xs">
          {updateInfo.published_at && (
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>发布日期: {formatDate(updateInfo.published_at)}</span>
            </div>
          )}

          <div>
            <h4 className="font-semibold dark:text-slate-300 text-slate-700 mb-1.5">更新说明</h4>
            <div className="p-3.5 rounded-xl dark:bg-slate-950/60 bg-slate-50 border dark:border-slate-800 border-slate-200 max-h-48 overflow-y-auto font-sans leading-relaxed dark:text-slate-300 text-slate-700 whitespace-pre-wrap">
              {updateInfo.release_notes?.trim() || '包含最新的功能优化与性能稳定性改进。'}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t dark:border-slate-800 border-slate-200 dark:bg-slate-950/60 bg-slate-50/80 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleOpenReleasePage}
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            在 GitHub 查看详情
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-700 border dark:border-transparent border-slate-200 font-medium transition-colors shadow-sm"
            >
              稍后再说
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              下载并安装新版本
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
