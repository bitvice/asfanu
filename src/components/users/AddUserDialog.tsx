'use client';

import * as React from 'react';
import { UserRole } from '@/lib/security/cnp-masker';
import { createUserAction } from '@/features/users/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserPlus, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserDialog({ isOpen, onClose, onSuccess }: AddUserDialogProps) {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('operator');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createUserAction({
      fullName,
      email,
      password,
      role,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('operator');
      onSuccess();
      onClose();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs" onClick={onClose} />

      <Card className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 z-10 animate-in fade-in zoom-in-95 duration-150">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Adaugă Utilizator Nou
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Creați un cont nou de utilizator cu un rol specific în aplicație.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nume Complet
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Popescu Ion"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Adresă de E-mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ion.popescu@asfanu.ro"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Parolă Inițială
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rol Acces Aplicație
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="operator">Operator (Creare & Editare Înregistrări)</option>
                <option value="admin">Administrator (Acces Complet & Gestionare Utilizatori)</option>
                <option value="viewer">Viewer (Doar Vizualizare CNP Maskat)</option>
              </select>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="text-xs">
              Anulează
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 font-medium">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Se creează...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Creează Utilizator
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>,
    document.body
  );
}
