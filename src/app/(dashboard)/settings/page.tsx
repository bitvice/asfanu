'use client';

import * as React from 'react';
import { fetchAuditLogsAction, AuditLogItem } from '@/features/audit/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { testSmtpConnectionAction } from '@/features/email/actions';
import { Input } from '@/components/ui/input';
import { Settings, ShieldAlert, Eye, Download, UserCog, RefreshCw, Key, ShieldCheck, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // SMTP Test state
  const [testEmailInput, setTestEmailInput] = React.useState('gabi@bitvice.ro');
  const [testingSmtp, setTestingSmtp] = React.useState(false);
  const [smtpTestResult, setSmtpTestResult] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAuditLogs = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogsAction();
      setLogs(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Nu aveți permisiunea de a accesa jurnalele de audit.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  async function handleTestSmtpConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmailInput || !testEmailInput.trim()) return;
    setTestingSmtp(true);
    setSmtpTestResult(null);

    const res = await testSmtpConnectionAction(testEmailInput.trim());

    if (res.error) {
      setSmtpTestResult({ type: 'error', text: res.error });
    } else {
      setSmtpTestResult({
        type: 'success',
        text: res.data?.message || `Emailul de test a fost trimis cu succes către ${testEmailInput}!`,
      });
    }
    setTestingSmtp(false);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Setări Aplicație & Jurnal de Audit
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitorizați accesul la datele cu caracter personal (PII) și istoricul operațiunilor sensibile.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reîmprospătează Audit
        </Button>
      </div>

      {/* Security Policies Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Politică de Securitate Datelor (CNP & PII)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-indigo-950/80 dark:text-indigo-200/80 space-y-1.5">
            <p>• Toate codurile CNP sunt maskate server-side (`199******1234`) pentru rolurile non-admin.</p>
            <p>• Orice acțiune de de-maskare CNP este înregistrată automat în jurnalul de audit.</p>
            <p>• Exporturile de fișiere sunt restricționate și arhivate în `audit_logs`.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" /> Autentificare & RLS Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p>• Supabase Auth cu verificare prin jetoane JWT securizate.</p>
            <p>• Toate tabelele PostgreSQL au Row-Level Security (RLS) activat per rol.</p>
            <p>• Cheia Service-Role nu este expusă niciodată în codul client.</p>
          </CardContent>
        </Card>
      </div>

      {/* SMTP Service Configuration & Testing Card */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-4 h-4" /> Configurare & Testare Serviciu SMTP Email
            </CardTitle>
            <Badge variant="outline" className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200">
              Zoho SMTP (SSL: 465)
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Verificați conexiunea cu serverul de email pentru expedierea voucherelor către familii.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
            <div>
              <span className="text-slate-400 block font-sans text-[11px]">Server SMTP Host:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">smtp.zoho.eu</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[11px]">Port & Securitate:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">465 (SSL/TLS)</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[11px]">Adresă Expeditor:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">brasov@asfanu.ro</span>
            </div>
          </div>

          <form onSubmit={handleTestSmtpConnection} className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Adresă Email Destinație pentru Test:
              </label>
              <Input
                type="email"
                required
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                placeholder="gabi@bitvice.ro"
                className="text-xs font-mono bg-white dark:bg-slate-950"
              />
            </div>
            <div className="pt-5">
              <Button
                type="submit"
                disabled={testingSmtp}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 h-9"
              >
                {testingSmtp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{testingSmtp ? 'Se testează conexiunea...' : 'Trimite Mail de Test'}</span>
              </Button>
            </div>
          </form>

          {smtpTestResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                smtpTestResult.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
              }`}
            >
              {smtpTestResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{smtpTestResult.text}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Jurnal de Audit (Ultimele 100 Operațiuni Sensibile)
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Înregistrare automată a citirilor de CNP, exporturilor și modificărilor de rol
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {logs.length} Înregistrări Audit
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center text-xs text-red-500">{error}</div>
          ) : loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Se încarcă jurnalul de audit...
            </div>
          ) : logs.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-slate-400">
              Nu există evenimente de audit înregistrate încă.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-950">
                <TableRow>
                  <TableHead className="text-xs">Data & Ora</TableHead>
                  <TableHead className="text-xs">Utilizator</TableHead>
                  <TableHead className="text-xs">Acțiune Executată</TableHead>
                  <TableHead className="text-xs">Entitate Target</TableHead>
                  <TableHead className="text-xs">Metadate Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">
                      {new Date(log.created_at).toLocaleString('ro-RO')}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{log.user_email}</TableCell>
                    <TableCell className="text-xs">
                      {log.action === 'READ_CNP' && (
                        <Badge variant="warning" className="gap-1 text-[10px]">
                          <Eye className="w-3 h-3" /> Citire CNP
                        </Badge>
                      )}
                      {log.action === 'EXPORT_REGISTRATIONS' && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Download className="w-3 h-3" /> Export Date
                        </Badge>
                      )}
                      {log.action === 'UPDATE_USER_ROLE' && (
                        <Badge variant="default" className="gap-1 text-[10px] bg-indigo-600">
                          <UserCog className="w-3 h-3" /> Schimbare Rol
                        </Badge>
                      )}
                      {log.action !== 'READ_CNP' && log.action !== 'EXPORT_REGISTRATIONS' && log.action !== 'UPDATE_USER_ROLE' && (
                        <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono uppercase text-slate-500">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500 max-w-[200px] truncate">
                      {JSON.stringify(log.metadata)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
