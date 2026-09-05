'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    ({ type, message, title }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, message, title };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const toastHelpers = React.useMemo(
    () => ({
      success: (message: string, title?: string) => showToast({ type: 'success', message, title }),
      error: (message: string, title?: string) => showToast({ type: 'error', message, title }),
      info: (message: string, title?: string) => showToast({ type: 'info', message, title }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast: toastHelpers }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in-0 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-white dark:bg-slate-900/95 dark:border-emerald-500/50'
              : toast.type === 'error'
              ? 'bg-slate-900/95 border-red-500/40 text-white dark:bg-slate-900/95 dark:border-red-500/50'
              : 'bg-slate-900/95 border-indigo-500/40 text-white dark:bg-slate-900/95 dark:border-indigo-500/50'
          }`}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {toast.type === 'success' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
            )}

            <div className="space-y-0.5 min-w-0 flex-1">
              {toast.title && (
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {toast.title}
                </h5>
              )}
              <p className="text-xs leading-relaxed text-slate-100 font-medium break-words">
                {toast.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
