'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
});

export function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : uncontrolledValue;
  const setActiveTab = isControlled ? (onValueChange ?? (() => {})) : setUncontrolledValue;

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  children,
  value,
  className,
  disabled,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        isActive
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const { activeTab } = React.useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-4 animate-in fade-in-0 slide-in-from-bottom-1', className)}
    >
      {children}
    </div>
  );
}
