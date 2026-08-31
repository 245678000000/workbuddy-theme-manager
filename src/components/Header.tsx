import React from 'react';
import { WorkBuddyStatus } from '../types/skin';
import { Play, Power, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface HeaderProps {
  status: WorkBuddyStatus | null;
  onLaunch: () => void;
  onClose: () => void;
  onReset: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onLaunch,
  onClose,
  onReset,
  loading,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            WorkBuddy 皮肤与主题管理器
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            非侵入式热换肤 · CDP 协议即时注入 · 零破坏安全还原
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 状态指示胶囊 */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
          {status?.cdp_connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">CDP 调试端口已连接</span>
            </>
          ) : status?.is_running ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-400">运行中 (未开启调试端口)</span>
            </>
          ) : status?.is_installed ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span className="text-slate-400">已就绪 (未运行)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400">未检测到 WorkBuddy</span>
            </>
          )}
        </div>

        {/* 启动/重启按钮 */}
        {status?.is_installed && (
          <button
            onClick={onLaunch}
            disabled={loading || status.is_running}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="以带调试端口的方式启动 WorkBuddy，以便动态注入皮肤"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {status.is_running ? '请先安全关闭后启动' : '启动 WorkBuddy'}
          </button>
        )}

        {/* 退出进程按钮 */}
        {status?.is_running && (
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
            title="关闭 WorkBuddy 进程"
          >
            <Power className="w-4 h-4" />
          </button>
        )}

        {/* 一键安全还原按钮 */}
        <button
          onClick={onReset}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          title="清除所有已注入的自定义 CSS，瞬间恢复官方默认外观"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          安全还原原生
        </button>
      </div>
    </header>
  );
};
