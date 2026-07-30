'use client';

import * as React from 'react';
import { RegistrationFilters } from '@/components/registrations/RegistrationFilters';
import { RegistrationsTable, RegistrationRowData } from '@/components/registrations/RegistrationsTable';
import {
  fetchRegistrationsAction,
  deleteRegistrationAction,
  getUnmaskedChildCNPAction,
} from '@/features/registrations/actions';
import { Button } from '@/components/ui/button';
import { Plus, Users, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationsPage() {
  const [data, setData] = React.useState<RegistrationRowData[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<{
    search?: string;
    county?: string;
    city?: string;
    privacyPolicyAccepted?: boolean;
  }>({});

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRegistrationsAction({
        ...filters,
        page,
        pageSize: 10,
      });
      setData(res.registrations as unknown as RegistrationRowData[]);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      // Quiet error fallback
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = React.useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  async function handleDelete(id: string) {
    await deleteRegistrationAction(id);
    loadData();
  }

  function handleExport(format: 'csv' | 'xlsx') {
    const params = new URLSearchParams();
    params.set('format', format);
    if (filters.search) params.set('search', filters.search);
    if (filters.county) params.set('county', filters.county);
    if (filters.city) params.set('city', filters.city);

    window.open(`/api/export?${params.toString()}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Registru Înregistrări Familii
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Căutați, filtrați și gestionați datele familiilor înregistrate.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reîmprospătează
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('xlsx')}
            className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            Exportă XLSX
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="gap-1.5 text-xs text-slate-700 dark:text-slate-300"
          >
            <Download className="w-3.5 h-3.5" />
            Exportă CSV
          </Button>

          <Link href="/registrations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-sm">
              <Plus className="w-4 h-4" />
              Adaugă Înregistrare
            </Button>
          </Link>
        </div>
      </div>

      <RegistrationFilters onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-xs text-slate-400">
          Se încarcă înregistrările...
        </div>
      ) : (
        <RegistrationsTable
          data={data}
          totalCount={totalCount}
          page={page}
          pageSize={10}
          totalPages={totalPages}
          onPageChange={setPage}
          canEdit={true}
          canDelete={true}
          canUnmaskCNP={true}
          onDeleteRequest={handleDelete}
          onUnmaskChildCNP={getUnmaskedChildCNPAction}
        />
      )}
    </div>
  );
}
