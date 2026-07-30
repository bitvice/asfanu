'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  UserCog,
  Settings,
  Heart,
} from 'lucide-react';

export const navigationItems = [
  { name: 'Panou Principal', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Înregistrări', href: '/registrations', icon: Users },
  { name: 'Import Excel', href: '/imports', icon: FileSpreadsheet },
  { name: 'Utilizatori', href: '/users', icon: UserCog },
  { name: 'Setări', href: '/settings', icon: Settings },
];

export function SidebarNavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1">
      {navigationItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 border-r border-slate-800 bg-slate-900 text-slate-100 min-h-screen flex-col shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-center bg-slate-950/40">
        <Link href="/dashboard" className="block py-1">
          <img
            src="/logo.png"
            alt="ASFANU Logo"
            className="h-16 w-auto object-contain"
          />
        </Link>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <SidebarNavItems />
        <div className="border-t border-slate-800 pt-4">
          <a
            id="KronelStudio"
            href="https://kronel.io"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/70 via-slate-900/60 to-violet-950/40 p-3 transition duration-200 hover:-translate-y-0.5 hover:from-slate-800 hover:to-violet-950/60 hover:shadow-lg hover:shadow-violet-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Deschide site-ul Kronel Studio"
          >
            <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Implementat cu <Heart className="w-3 h-3 text-red-500 fill-red-500 inline-block shrink-0 mx-0.5" /> de
            </span>
            <span className="mt-2.5 flex items-center gap-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 79.651474 109.62114"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-10 w-7 shrink-0 transition-transform duration-200 group-hover:scale-105"
              >
                <g transform="translate(-1430.4836,-342.95062)">
                  <g transform="matrix(0.41496015,0,0,0.41496015,735.84033,1012.6963)" fill="#ececec">
                    <rect x="1826.0206" y="-1600.3601" width="1.5182211" height="0.60728842" fill="#ececec" />
                    <path
                      fill="#ececec"
                      d="m 1769.5291,-1614 -29.0383,66.5608 c 6.292,2.5751 10.4028,8.6987 10.4031,15.4972 -2e-4,9.2483 -7.4977,16.7458 -16.746,16.7455 -9.248,-2e-4 -16.7447,-7.4975 -16.7449,-16.7455 10e-5,-4.4466 1.7685,-8.7106 4.9157,-11.8518 l -48.3114,-48.3115 H 1674 l 0.068,242.278 64.5471,-64.5471 -43.9386,-93.9173 101.1748,36.6811 69.2071,-69.2071 v -51.2876 h -0.01 l -48.2047,48.2048 c 3.2132,3.1494 5.0236,7.4592 5.0236,11.9585 -10e-5,9.248 -7.4968,16.7453 -16.7448,16.7455 -9.248,-2e-4 -16.7446,-7.4975 -16.7448,-16.7455 0,-6.7271 4.0249,-12.801 10.2203,-15.4223 z"
                    />
                    <path
                      fill="#7a3cff"
                      d="m 1718.9636,-1486.5286 63.7633,136.2922 v 0.1711 l 0.056,-0.056 0.1377,0.2937 0.2667,-0.6976 82.7624,-82.7394 -0.1,0.01 0.024,-0.011 z"
                    />
                  </g>
                </g>
              </svg>
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px] font-semibold text-slate-100 transition-colors group-hover:text-white">Kronel Studio</span>
                <span className="mt-0.5 block text-[10px] text-slate-500 transition-colors group-hover:text-violet-300">Software &amp; sisteme digitale</span>
              </span>
              <span className="ml-auto text-xs text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" aria-hidden="true">↗</span>
            </span>
          </a>
        </div>
      </div>
    </aside>
  );
}
