'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, User, Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { logout } from '@/services/auth.service';
import { UserRole } from '@/lib/security/cnp-masker';
import { SidebarNavItems } from '@/components/shared/Sidebar';
import { createPortal } from 'react-dom';

interface HeaderProps {
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
}

export function Header({ userEmail, userName, userRole = 'viewer' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const displayName = userName || userEmail || 'Utilizator Neautentificat';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors z-20 sticky top-0">
        {/* Left Section: Mobile Menu Toggle & Logo / Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-10 w-10 text-slate-700 dark:text-slate-200"
            aria-label="Comută meniul navigare"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>

          <Link href="/dashboard" className="flex items-center gap-3">

            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Consolă Administrare Internă
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sistem Gestiune Înregistrări & Membri
              </p>
            </div>
          </Link>
        </div>

        {/* Right Section: User & Logout Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-3 text-sm border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <User className="w-4 h-4" />
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
              className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 gap-1.5 text-xs font-medium px-2 sm:px-3"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Ieșire</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Mobile Navigation Drawer Sheet (Viewport Centered Portal) */}
      {mobileOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Sidebar Content */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-white h-full flex flex-col p-5 shadow-2xl z-10 border-r border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <img
                  src="/logo.png"
                  alt="ASFANU Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* User Profile Card inside Mobile Drawer */}
            <div className="p-3 rounded-xl bg-slate-800/80 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-white">{displayName}</div>
                <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
                <div className="mt-1">
                  <Badge variant="default" className="text-[9px] uppercase py-0 px-1 bg-indigo-600">
                    {userRole}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <SidebarNavItems onNavigate={() => setMobileOpen(false)} />

            {/* Mobile Footer Logout */}
            <div className="pt-4 border-t border-slate-800 mt-auto">
              <form action={logout}>
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full justify-center gap-2 text-xs font-semibold bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4" /> Deconectare
                </Button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
