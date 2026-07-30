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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Înregistrări
            </CardTitle>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {loading ? '...' : metrics?.totalRegistrations ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Familii înregistrate în sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Copii
            </CardTitle>
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {loading ? '...' : metrics?.totalChildren ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Copii asociați înregistrărilor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Importuri Excel
            </CardTitle>
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {loading ? '...' : metrics?.totalImports ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sesiuni de import procesate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              CNP Lipsă / Incomplet
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {loading ? '...' : metrics?.incompleteCNPCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Înregistrări ce necesită atenție</p>
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
      <Card className="border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
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
