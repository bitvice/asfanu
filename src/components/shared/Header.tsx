'use client';

import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  userEmail?: string;
  userRole?: string;
}

export function Header({ userEmail = 'operator@asfanu.ro', userRole = 'operator' }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Consolă Administrare Internă</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800">{userEmail}</span>
            <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold py-0 px-1">
              {userRole}
            </Badge>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-600 gap-1.5">
          <LogOut className="w-4 h-4" />
          Ieșire
        </Button>
      </div>
    </header>
  );
}
