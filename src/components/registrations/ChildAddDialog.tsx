'use client';

import * as React from 'react';
import { Plus, Save, X, Baby } from 'lucide-react';
import { addChildAction } from '@/features/registrations/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChildAddDialogProps {
  registrationId: string;
  parentLastName: string;
  onSaved: () => Promise<void>;
}

export function ChildAddDialog({ registrationId, parentLastName, onSaved }: ChildAddDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [values, setValues] = React.useState({
    first_name: '',
    last_name: parentLastName || '',
    email: '',
    cnp: '',
    birth_date: '',
  });

  React.useEffect(() => {
    if (!open) return;
    setValues({
      first_name: '',
      last_name: parentLastName || '',
      email: '',
      cnp: '',
      birth_date: '',
    });
    setError(null);
  }, [open, parentLastName]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.first_name.trim()) {
      setError('Prenumele copilului este obligatoriu.');
      return;
    }
    if (!values.last_name.trim()) {
      setError('Numele de familie al copilului este obligatoriu.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await addChildAction(registrationId, values);
      if (result.error) {
        setError(result.error);
        return;
      }

      await onSaved();
      setOpen(false);
    } catch {
      setError('Copilul nu a putut fi adăugat.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" /> Adaugă Copil
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="presentation">
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Adăugare Copil Nou
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">Adaugă un copil asociat acestei familii.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={submitting} aria-label="Închide">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prenume Copil *
                  <Input
                    value={values.first_name}
                    onChange={(event) => setValues((current) => ({ ...current, first_name: event.target.value }))}
                    placeholder="ex: Matei"
                    className="mt-1.5"
                    required
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nume de familie *
                  <Input
                    value={values.last_name}
                    onChange={(event) => setValues((current) => ({ ...current, last_name: event.target.value }))}
                    placeholder="ex: Popescu"
                    className="mt-1.5"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Anul sau Data Nașterii
                  <Input
                    value={values.birth_date}
                    onChange={(event) => setValues((current) => ({ ...current, birth_date: event.target.value }))}
                    placeholder="ex: 2018 sau 2018-05-15"
                    className="mt-1.5 font-mono text-xs"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CNP Copil (opțional)
                  <Input
                    inputMode="numeric"
                    maxLength={13}
                    value={values.cnp}
                    onChange={(event) => setValues((current) => ({ ...current, cnp: event.target.value }))}
                    className="mt-1.5 font-mono"
                    placeholder="ex: 5010101410018"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Copil (opțional)
                <Input
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                  placeholder="opțional"
                  className="mt-1.5"
                />
              </label>

              {error && <p className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={submitting}>
                  Renunță
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold">
                  <Save className="h-4 w-4" /> {submitting ? 'Se salvează...' : 'Adaugă Copil'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
