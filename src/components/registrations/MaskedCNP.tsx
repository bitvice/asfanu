'use client';

import * as React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { maskCNP } from '@/lib/security/cnp-masker';

interface MaskedCNPProps {
  cnp: string;
  registrationId?: string;
  canUnmask?: boolean;
  onUnmaskRequest?: () => Promise<string | null>;
}

export function MaskedCNP({ cnp, canUnmask = false, onUnmaskRequest }: MaskedCNPProps) {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [unmaskedValue, setUnmaskedValue] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const displayValue = isRevealed && unmaskedValue ? unmaskedValue : maskCNP(cnp);

  async function handleToggle() {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    if (!canUnmask) {
      return;
    }

    if (unmaskedValue) {
      setIsRevealed(true);
      return;
    }

    if (onUnmaskRequest) {
      setLoading(true);
      try {
        const raw = await onUnmaskRequest();
        if (raw) {
          setUnmaskedValue(raw);
          setIsRevealed(true);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
      <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-wider">
        {displayValue}
      </span>

      {canUnmask && onUnmaskRequest && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={loading}
          onClick={handleToggle}
          className="h-5 w-5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          title={isRevealed ? "Ascunde CNP" : "Afișează CNP complet (Înregistrează Audit)"}
        >
          {loading ? (
            <span className="animate-spin text-[10px]">...</span>
          ) : isRevealed ? (
            <EyeOff className="w-3 h-3" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </Button>
      )}

      {!canUnmask && (
        <span title="Acces CNP restricționat la Admin">
          <Lock className="w-3 h-3 text-slate-400" />
        </span>
      )}
    </div>
  );
}
