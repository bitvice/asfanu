'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileCheck, AlertTriangle, FileSpreadsheet, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  totalRegistrations: number;
  totalChildren: number;
  totalImports: number;
  incompleteCNPCount: number;
  missingEmailCount: number;
  missingPhoneCount: number;
  noPrivacyCount: number;
  registrationsByCounty: Array<{ county: string; count: number }>;
  registrationsByCity: Array<{ city: string; count: number }>;
  recentImports: Array<{ id: string; file_name: string; total_rows: number; successful_rows: number; started_at: string; status: string }>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadMetrics = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // Quiet catch
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Panou Principal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Privire de ansamblu asupra înregistrărilor familiilor, calității datelor și importurilor.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadMetrics} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reîmprospătează
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-200 dark:hover:border-indigo-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Înregistrări
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : metrics?.totalRegistrations ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Familii înregistrate în sistem</p>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-200 dark:hover:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Copii
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <FileCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : metrics?.totalChildren ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Copii asociați înregistrărilor</p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-200 dark:hover:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Importuri Excel
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : metrics?.totalImports ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Sesiuni de import procesate</p>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-200 dark:hover:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CNP Lipsă / Incomplet
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {loading ? '...' : metrics?.incompleteCNPCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Înregistrări ce necesită atenție</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Grid: County & Quality Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Registrations by County */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="w-4 h-4 text-indigo-600" /> Înregistrări pe Județe
            </CardTitle>
            <CardDescription>Distribuția geografică a familiilor înregistrate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading ? (
              <p className="text-slate-400">Se încarcă distribuția...</p>
            ) : metrics?.registrationsByCounty.length === 0 ? (
              <p className="text-slate-400">Nu există date despre județe încă.</p>
            ) : (
              metrics?.registrationsByCounty.slice(0, 5).map((item) => (
                <div key={item.county} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.county}</span>
                  <Badge variant="secondary">{item.count} familii</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Data Quality Counters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Calitate Date & Acorduri
            </CardTitle>
            <CardDescription>Verificare date lipsă și consimțământ confidențialitate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-700 dark:text-slate-300">Fără Acord Politică Confidențialitate:</span>
              <Badge variant={metrics?.noPrivacyCount ? 'destructive' : 'success'}>
                {metrics?.noPrivacyCount ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-700 dark:text-slate-300">Email Principal Lipsă / Incomplet:</span>
              <Badge variant={metrics?.missingEmailCount ? 'warning' : 'success'}>
                {metrics?.missingEmailCount ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-700 dark:text-slate-300">Telefon Lipsă / Incomplet:</span>
              <Badge variant={metrics?.missingPhoneCount ? 'warning' : 'success'}>
                {metrics?.missingPhoneCount ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Card */}
      <Card className="border border-indigo-200/80 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/80 via-purple-50/30 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-indigo-950 dark:text-indigo-200">Acțiuni Rapide</CardTitle>
          <CardDescription className="dark:text-indigo-300/80">
            Importați un fișier Excel existent sau adăugați manual o înregistrare nouă.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Pornește Import Excel
          </Link>
          <Link
            href="/registrations/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Adaugă Înregistrare Manuală
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
