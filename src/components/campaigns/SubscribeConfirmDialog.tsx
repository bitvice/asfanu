'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { subscribeFamilyAction } from '@/features/campaigns/actions';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SubscribeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  discountPercentage: number;
  registrationId: string;
  familyName: string;
  onSubscribed: (couponCode: string) => void;
}

export function SubscribeConfirmDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  discountPercentage,
  registrationId,
  familyName,
  onSubscribed,
}: SubscribeConfirmDialogProps) {
  const [subscribing, setSubscribing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleSubscribe() {
    setSubscribing(true);
    setError(null);

    const res = await subscribeFamilyAction(campaignId, registrationId);

    if (res.error) {
      setError(res.error);
      setSubscribing(false);
      return;
    }

    setSuccess(res.couponCode || null);
    setSubscribing(false);
    onSubscribed(res.couponCode || '');
  }

  function handleClose() {
    setError(null);
    setSuccess(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {success ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <DialogTitle>Înscriere Reușită!</DialogTitle>
              </div>
              <DialogDescription>
                Familia a fost înscrisă cu succes în campanie.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                Cod cupon generat
              </p>
              <p className="text-2xl font-black font-mono tracking-wider text-emerald-700 dark:text-emerald-300">
                {success}
              </p>
            </div>
            <DialogFooter>
              <Button
                size="sm"
                onClick={handleClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Închide
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <DialogTitle>Confirmare Înscriere</DialogTitle>
              </div>
              <DialogDescription>
                Sunteți sigur că doriți să înscrieți această familie în campanie?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Familie:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{familyName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Campanie:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{campaignName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Reducere:</span>
                <Badge variant="success">-{discountPercentage}%</Badge>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                La confirmare, se va genera automat un cod de cupon unic de forma <span className="font-mono font-bold">ASFANU{'{'}<em>nr</em>{'}'}</span>.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose>
                <Button variant="outline" size="sm" className="text-xs">
                  Anulează
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
              >
                {subscribing ? 'Se înscrie...' : 'Confirmă Înscrierea'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
