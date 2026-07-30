'use client';

import { LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { logout } from '@/services/auth.service';
import { UserRole } from '@/lib/security/cnp-masker';

interface HeaderProps {
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
}

export function Header({ userEmail, userName, userRole = 'viewer' }: HeaderProps) {
  const displayName = userName || userEmail || 'Utilizator Neautentificat';

  return (
    <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-6 flex items-center justify-between shadow-sm transition-colors z-20">
      <div className="flex items-center gap-3">
        {/* <img
          src="/logo.png"
          alt="ASFANU Logo"
          className="h-14 w-auto object-contain drop-shadow-sm"
        /> */}
        <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Consolă Administrare Internă
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Sistem Gestiune Înregistrări & Membri
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <ThemeToggle />

        <div className="flex items-center gap-3 text-sm border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {displayName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {userEmail && userEmail !== displayName && (
                <span className="text-[11px] text-slate-500 font-mono leading-none">
                  {userEmail}
                </span>
              )}
              {userRole === 'admin' && (
                <Badge variant="default" className="text-[9px] uppercase font-bold py-0 px-1 bg-indigo-600 gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </Badge>
              )}
              {userRole === 'operator' && (
                <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 px-1">
                  Operator
                </Badge>
              )}
              {userRole === 'viewer' && (
                <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 px-1">
                  Viewer
                </Badge>
              )}
            </div>
          </div>
        </div>

        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            Ieșire
          </Button>
        </form>
      </div>
    </header>
  );
}
