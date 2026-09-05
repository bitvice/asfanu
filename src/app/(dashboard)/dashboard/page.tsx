'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileCheck,
  FileSpreadsheet,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Tag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface ActiveCampaignMetric {
  id: string;
  name: string;
  discount_percentage: number;
  code_slug: string | null;
  status: string;
  subscription_count: number;
}

interface DashboardMetrics {
  totalRegistrations: number;
  totalChildren: number;
  totalImports: number;
  incompleteCNPCount: number;
  missingEmailCount: number;
  missingPhoneCount: number;
  noPrivacyCount: number;
  activeCampaignsCount: number;
  totalCampaignSubscriptions: number;
  activeCampaigns: ActiveCampaignMetric[];
  registrationsByCounty: Array<{ county: string; count: number }>;
  registrationsByCity: Array<{ city: string; count: number }>;
  recentImports: Array<{
    id: string;
    file_name: string;
    total_rows: number;
    successful_rows: number;
    started_at: string;
    status: string;
  }>;
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
            Privire de ansamblu asupra înregistrărilor familiilor, calității datelor, importurilor și campaniilor.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadMetrics} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reîmprospătează
        </Button>
      </div>

      {/* Metric Cards Grid — 4 Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
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

        <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
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

        <Link href="/campaigns" className="block group">
          <Card className="hover:border-purple-300 dark:hover:border-purple-700 transition-all border-purple-200/70 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-indigo-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Campanii Active
              </CardTitle>
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Tag className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 tracking-tight flex items-baseline gap-2">
                <span>{loading ? '...' : metrics?.activeCampaignsCount ?? 0}</span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {metrics?.activeCampaignsCount === 1 ? 'campanie' : 'campanii'}
                </span>
              </div>
              <p className="text-xs text-purple-600/80 dark:text-purple-300/70 mt-1.5 font-medium flex items-center gap-1">
                <span>{loading ? '...' : metrics?.totalCampaignSubscriptions ?? 0} familii înscrise</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
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
      </div>

      {/* Breakdown Grid: Active Campaigns, County & Data Quality */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Active Campaigns Card */}
        <Card className="border border-purple-200/60 dark:border-purple-900/50 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-950 dark:text-purple-200">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Campanii de Reduceri
                </CardTitle>
                <Link
                  href="/campaigns"
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
                >
                  Vezi toate <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <CardDescription>Campaniile curente de reduceri și participarea familiilor</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs">
              {loading ? (
                <p className="text-slate-400 py-4 text-center">Se încarcă campaniile...</p>
              ) : !metrics?.activeCampaigns || metrics.activeCampaigns.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-slate-500 font-medium">Nu există campanii active momentan.</p>
                  <Link href="/campaigns">
                    <Button variant="outline" size="sm" className="text-xs font-bold gap-1 text-purple-600">
                      Creează o campanie nouă
                    </Button>
                  </Link>
                </div>
              ) : (
                metrics.activeCampaigns.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                  >
                    <div className="space-y-0.5 max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                          {c.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cod: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{c.code_slug || 'ASF'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-none font-bold text-[11px]">
                        -{c.discount_percentage}%
                      </Badge>
                      <Badge variant="secondary" className="font-medium text-[10px]">
                        {c.subscription_count} familii
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </div>

          {metrics?.activeCampaigns && metrics.activeCampaigns.length > 0 && (
            <div className="px-6 pb-4 pt-2">
              <Link href="/campaigns">
                <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 gap-1.5 h-8">
                  <span>Gestionează Toate Campaniile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Registrations by County */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="w-4 h-4 text-indigo-600" /> Înregistrări pe Județe
            </CardTitle>
            <CardDescription>Distribuția geografică a familiilor înregistrate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading ? (
              <p className="text-slate-400 py-4 text-center">Se încarcă distribuția...</p>
            ) : !metrics?.registrationsByCounty || metrics.registrationsByCounty.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">Nu există date despre județe încă.</p>
            ) : (
              metrics.registrationsByCounty.slice(0, 5).map((item) => (
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
          <CardHeader className="pb-3">
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
            Importați un fișier Excel existent, adăugați manual o înregistrare nouă sau creați o campanie nouă.
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
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Tag className="w-4 h-4" />
            Vezi Campaniile
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
