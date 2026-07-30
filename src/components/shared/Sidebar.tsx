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
} from 'lucide-react';

const navigation = [
  { name: 'Panou Principal', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Înregistrări', href: '/registrations', icon: Users },
  { name: 'Import Excel', href: '/imports', icon: FileSpreadsheet },
  { name: 'Utilizatori', href: '/users', icon: UserCog },
  { name: 'Setări', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-100 min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-center bg-slate-950/40">
        <Link href="/dashboard" className="block py-1">
          <img
            src="/logo.png"
            alt="ASFANU Logo"
            className="h-16 w-auto object-contain"
          />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        Versiune v1.0.0 (Producție)
      </div>
    </aside>
  );
}
