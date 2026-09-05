'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { loginWithEmail } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

import { fetchPublicAccountsAction } from '@/features/users/actions';
import { UserRole } from '@/lib/security/cnp-masker';

interface AccountOption {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium"
    >
      {pending ? (
        'Se autentifică...'
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          Autentificare
        </>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [accounts, setAccounts] = React.useState<AccountOption[]>([]);
  const [selectedEmail, setSelectedEmail] = React.useState('');
  const [loadingAccounts, setLoadingAccounts] = React.useState(true);

  React.useEffect(() => {
    async function loadAccounts() {
      setLoadingAccounts(true);
      try {
        const list = await fetchPublicAccountsAction();
        setAccounts(list as AccountOption[]);
        if (list && list.length > 0) {
          setSelectedEmail(list[0].email);
        }
      } catch {
        // Fallback quiet handle
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);
    const result = await loginWithEmail(formData);
    if (result?.error) {
      setErrorMsg(result.error);
    }
  }

  function handleSelectAccount(email: string) {
    setSelectedEmail(email);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center dashboard-bg p-4 transition-colors relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="ASFANU Logo"
            className="h-24 w-auto object-contain mb-2 drop-shadow-md"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sistem securizat de gestiune internă a înregistrărilor
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
              Autentificare în Cont
            </CardTitle>
            <CardDescription>
              Selectați un cont din listă sau introduceți e-mailul și parola.
            </CardDescription>
          </CardHeader>
          <form action={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Dynamic Account Selector Dropdown ("Lista CONT") */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                  <span>Lista CONT / Conturi Înregistrate</span>
                  {loadingAccounts && <span className="text-[10px] text-slate-400 font-normal">Se încarcă...</span>}
                </label>
                <select
                  value={selectedEmail}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="w-full h-9 rounded-md border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {accounts.length === 0 ? (
                    <option value="">(Introduceți manual adresa de e-mail)</option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id} value={acc.email}>
                        {acc.full_name} — {acc.email} [{acc.role.toUpperCase()}]
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Adresă de E-mail
                </label>
                <Input
                  type="email"
                  name="email"
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  placeholder="operator@asfanu.ro"
                  required
                  className="bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Parolă
                </label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className="bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          Accesul este restricționat strict personalului autorizat.
        </div>
      </div>
    </div>
  );
}

