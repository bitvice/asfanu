'use client';

import * as React from 'react';
import { RegistrationFilters } from '@/components/registrations/RegistrationFilters';
import { RegistrationsTable, RegistrationRowData } from '@/components/registrations/RegistrationsTable';
import {
  fetchRegistrationsAction,
  deleteRegistrationAction,
  deleteMultipleRegistrationsAction,
} from '@/features/registrations/actions';
import { Button } from '@/components/ui/button';
import { Plus, Users, RefreshCw, Download, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationsPage() {
  const [data, setData] = React.useState<RegistrationRowData[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<{
    familyNumber?: string;
    search?: string;
    county?: string;
    city?: string;
    privacyPolicyAccepted?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }>({
    sortBy: 'family_number',
    sortOrder: 'asc',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRegistrationsAction({
        ...filters,
        page,
        pageSize,
      });
      setData(res.registrations as unknown as RegistrationRowData[]);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      // Quiet error fallback
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = React.useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSortChange = React.useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
    setPage(1);
  }, []);

  const handlePageSizeChange = React.useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  async function handleDelete(id: string) {
    await deleteRegistrationAction(id);
    loadData();
  }

  async function handleBulkDelete(ids: string[]) {
    await deleteMultipleRegistrationsAction(ids);
    loadData();
  }

  function handleExport(format: 'pdf' | 'xlsx') {
    const params = new URLSearchParams();
    params.set('format', format);
    if (filters.familyNumber) params.set('familyNumber', filters.familyNumber);
    if (filters.search) params.set('search', filters.search);
    if (filters.county) params.set('county', filters.county);
    if (filters.city) params.set('city', filters.city);
    if (typeof filters.privacyPolicyAccepted === 'boolean') {
      params.set('privacyPolicyAccepted', String(filters.privacyPolicyAccepted));
    }
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

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
            Exportă Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="gap-1.5 text-xs text-red-700 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <FileText className="w-3.5 h-3.5" />
            Exportă PDF
          </Button>

          <Link href="/registrations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-sm">
              <Plus className="w-4 h-4" />
              Adaugă Înregistrare
            </Button>
          </Link>
        </div>
      </div>

      <RegistrationFilters
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>Se încarcă înregistrările...</span>
        </div>
      ) : (
        <RegistrationsTable
          data={data}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          canEdit={true}
          canDelete={true}
          onDeleteRequest={handleDelete}
          onBulkDeleteRequest={handleBulkDelete}
        />
      )}
    </div>
  );
}
