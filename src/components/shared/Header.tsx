'use client';

import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { logout } from '@/services/auth.service';

interface HeaderProps {
  userEmail?: string;
  userRole?: string;
}

export function Header({ userEmail = 'operator@asfanu.ro', userRole = 'operator' }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shadow-sm transition-colors">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Consolă Administrare Internă
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <ThemeToggle />

        <div className="flex items-center gap-2 text-sm border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{userEmail}</span>
            <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold py-0 px-1 dark:border-slate-700">
              {userRole}
            </Badge>
          </div>
        </div>

        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Ieșire
          </Button>
        </form>
      </div>
    </header>
  );
}
