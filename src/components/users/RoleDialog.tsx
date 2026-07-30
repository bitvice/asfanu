'use client';

import * as React from 'react';
import { UserRole } from '@/lib/security/cnp-masker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCog, ShieldCheck } from 'lucide-react';

interface RoleDialogProps {
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, newRole: UserRole) => Promise<void>;
}

export function RoleDialog({
  userId,
  userName,
  userEmail,
  currentRole,
  isOpen,
  onClose,
  onSave,
}: RoleDialogProps) {
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(currentRole);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  if (!isOpen) return null;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onSave(userId, selectedRole);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Modificare Rol Utilizator</h3>
            <p className="text-xs text-slate-500">{userEmail}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Selectați noul rol pentru <strong>{userName}</strong>:
          </label>

          <div className="space-y-2">
            {[
              { role: 'admin' as UserRole, label: 'Administrator', desc: 'Acces complet, gestionare utilizatori, export ne-maskat & jurnal audit.' },
              { role: 'operator' as UserRole, label: 'Operator', desc: 'Creare și editare înregistrări, import fișiere Excel, export limitat.' },
              { role: 'viewer' as UserRole, label: 'Vizualizator (Read-Only)', desc: 'Doar vizualizare înregistrări, fără importuri sau exporturi.' },
            ].map((item) => (
              <label
                key={item.role}
                onClick={() => setSelectedRole(item.role)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole === item.role
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  checked={selectedRole === item.role}
                  onChange={() => setSelectedRole(item.role)}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.label}</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{item.role}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting} className="text-xs">
            Renunță
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-semibold"
          >
            <ShieldCheck className="w-4 h-4" />
            {submitting ? 'Se salvează...' : 'Salvează Rolul'}
          </Button>
        </div>
      </div>
    </div>
  );
}
