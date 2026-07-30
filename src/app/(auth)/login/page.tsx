'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { loginWithEmail } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, LogIn, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

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

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);
    const result = await loginWithEmail(formData);
    if (result?.error) {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            ASFANU CRM
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sistem securizat de gestiune internă a înregistrărilor
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
              Autentificare în Cont
            </CardTitle>
            <CardDescription>
              Introduceți adresa de e-mail și parola pentru a accesa platforma.
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

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Adresă de E-mail
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="operator@asfanu.ro"
                  required
                  className="bg-white dark:bg-slate-900"
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
                  className="bg-white dark:bg-slate-900"
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
