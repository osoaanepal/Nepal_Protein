import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, Menu } from 'lucide-react';

export const AdminHeader = ({ onOpenSidebar = () => {} }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden transition active:scale-95"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden xs:inline">Environment:</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded-full whitespace-nowrap">
            Live Production
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold flex items-center justify-center text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-white leading-none truncate max-w-[120px] md:max-w-[200px]">
              {user?.name}
            </p>
            <p className="text-[10px] text-orange-400 font-medium">Administrator</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition active:scale-95"
          title="Sign Out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
