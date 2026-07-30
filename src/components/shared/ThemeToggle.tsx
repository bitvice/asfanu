'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder during SSR hydration
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="icon"
        className="w-7 h-7"
        onClick={() => setTheme('light')}
        title="Mod Luminos (Light)"
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="icon"
        className="w-7 h-7"
        onClick={() => setTheme('dark')}
        title="Mod Întunecat (Dark)"
      >
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="icon"
        className="w-7 h-7"
        onClick={() => setTheme('system')}
        title="Sistem (System)"
      >
        <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      </Button>
    </div>
  );
}
