'use client';

import * as React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { updateChildAction } from '@/features/registrations/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface EditableChild {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  birth_date?: string | null;
}

interface ChildEditDialogProps {
  registrationId: string;
  child: EditableChild;
  onSaved: () => Promise<void>;
}

export function ChildEditDialog({ registrationId, child, onSaved }: ChildEditDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [values, setValues] = React.useState({
    first_name: child.first_name,
    last_name: child.last_name,
    email: child.email || '',
    cnp: '',
    birth_date: child.birth_date?.slice(0, 10) || '',
  });

  React.useEffect(() => {
    if (!open) return;
    setValues({
      first_name: child.first_name,
      last_name: child.last_name,
      email: child.email || '',
      cnp: '',
      birth_date: child.birth_date?.slice(0, 10) || '',
    });
    setError(null);
  }, [child, open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await updateChildAction(registrationId, child.id, values);
      if (result.error) {
        setError(result.error);
        return;
      }

      await onSaved();
      setOpen(false);
    } catch {
      setError('Datele copilului nu au putut fi salvate.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setOpen(true)}>
        <Edit className="h-3.5 w-3.5" /> Editează
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="presentation">
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-child-${child.id}`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id={`edit-child-${child.id}`} className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Date personale copil
                </h2>
                <p className="mt-1 text-xs text-slate-500">Completează sau actualizează informațiile copilului.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={submitting} aria-label="Închide">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prenume
                  <Input
                    value={values.first_name}
                    onChange={(event) => setValues((current) => ({ ...current, first_name: event.target.value }))}
                    className="mt-1.5"
                    required
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nume de familie
                  <Input
                    value={values.last_name}
                    onChange={(event) => setValues((current) => ({ ...current, last_name: event.target.value }))}
                    className="mt-1.5"
                    required
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email
                <Input
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                  className="mt-1.5"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data nașterii
                  <Input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={values.birth_date}
                    onChange={(event) => setValues((current) => ({ ...current, birth_date: event.target.value }))}
                    className="mt-1.5"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CNP nou
                  <Input
                    inputMode="numeric"
                    maxLength={13}
                    value={values.cnp}
                    onChange={(event) => setValues((current) => ({ ...current, cnp: event.target.value }))}
                    className="mt-1.5 font-mono"
                    placeholder="Lasă gol pentru a-l păstra"
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-500">
                Vârsta este recalculată automat din data nașterii. CNP-ul existent nu este afișat în formular.
              </p>

              {error && <p className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={submitting}>
                  Renunță
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700">
                  <Save className="h-4 w-4" /> {submitting ? 'Se salvează...' : 'Salvează'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
