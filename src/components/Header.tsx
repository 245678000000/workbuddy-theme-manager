import React from 'react';
import { WorkBuddyStatus } from '../types/skin';
import { Play, Power, ShieldCheck, AlertCircle, Moon, Sun, Monitor, RefreshCw } from 'lucide-react';

export type AppTheme = 'dark' | 'light' | 'system';

interface HeaderProps {
  status: WorkBuddyStatus | null;
  onLaunch: () => void;
  onClose: () => void;
  onReset: () => void;
  loading: boolean;
  appTheme: AppTheme;
  onAppThemeChange: (theme: AppTheme) => void;
  onCheckUpdate: () => void;
  hasUpdate?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onLaunch,
  onClose,
  onReset,
  loading,
  appTheme,
  onAppThemeChange,
  onCheckUpdate,
  hasUpdate = false,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 border-slate-200 dark:bg-slate-900/60 bg-white/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm dark:shadow-black/50 border dark:border-white/10 border-black/5 shrink-0 bg-slate-900 transition-transform hover:scale-105">
          <img
            src="/app-icon.png"
            alt="WorkBuddy 皮肤管理器 Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-base font-bold dark:text-slate-100 text-slate-900 flex items-center gap-2">
            WorkBuddy 皮肤与主题管理器
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 font-medium">
              v1.0
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-nowrap whitespace-nowrap">
        {/* 软件自身主题模式切换器 */}
        <div className="flex items-center p-0.5 rounded-lg dark:bg-slate-950/80 bg-slate-100 border dark:border-slate-800 border-slate-200 text-xs shrink-0">
          <button
            onClick={() => onAppThemeChange('light')}
            className={`p-1.5 rounded-md transition-all ${
              appTheme === 'light'
                ? 'bg-white text-amber-500 shadow-sm'
                : 'dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="软件浅色模式"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAppThemeChange('dark')}
            className={`p-1.5 rounded-md transition-all ${
              appTheme === 'dark'
                ? 'dark:bg-slate-800 bg-white text-indigo-500 dark:text-indigo-400 shadow-sm'
                : 'dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="软件暗黑模式"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAppThemeChange('system')}
            className={`p-1.5 rounded-md transition-all ${
              appTheme === 'system'
                ? 'dark:bg-slate-800 bg-white text-indigo-500 dark:text-indigo-400 shadow-sm'
                : 'dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="软件跟随操作系统"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 状态指示胶囊 */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg dark:bg-slate-950/80 bg-slate-100 border dark:border-slate-800 border-slate-200 text-xs shrink-0 whitespace-nowrap">
          {status?.cdp_connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-500 dark:text-emerald-400 font-medium">CDP 已连接</span>
            </>
          ) : status?.is_running ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-500 dark:text-amber-400">运行中 (未开启调试)</span>
            </>
          ) : status?.is_installed ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="dark:text-slate-400 text-slate-500">就绪 (未运行)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-rose-500">未检测到应用</span>
            </>
          )}
        </div>

        {/* 启动/重启按钮 */}
        {status?.is_installed && (
          <button
            onClick={onLaunch}
            disabled={loading || status.is_running}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap"
            title="以带调试端口的方式启动 WorkBuddy，以便动态注入皮肤"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {status.is_running ? '需先关闭后重启' : '启动 WorkBuddy'}
          </button>
        )}

        {/* 退出进程按钮 */}
        {status?.is_running && (
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-xs font-medium rounded-lg dark:bg-slate-800 bg-slate-100 hover:bg-rose-500/20 hover:text-rose-500 dark:text-slate-400 text-slate-600 transition-colors border dark:border-transparent border-slate-200 shrink-0"
            title="关闭 WorkBuddy 进程"
          >
            <Power className="w-4 h-4" />
          </button>
        )}

        {/* 检查更新按钮 */}
        <button
          onClick={onCheckUpdate}
          disabled={loading}
          className="relative p-1.5 text-xs font-medium rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 bg-white hover:bg-slate-100 dark:text-slate-200 text-slate-700 border dark:border-slate-700 border-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
          title="检查 GitHub 最新版本更新"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
          {hasUpdate && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </button>

        {/* 一键安全还原按钮 */}
        <button
          onClick={onReset}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 bg-white hover:bg-slate-100 dark:text-slate-200 text-slate-700 border dark:border-slate-700 border-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap"
          title="清除所有已注入的自定义 CSS，瞬间恢复官方默认外观"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          还原原生
        </button>
      </div>
    </header>
  );
};
