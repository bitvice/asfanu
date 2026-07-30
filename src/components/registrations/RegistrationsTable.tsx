'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

export interface RegistrationRowData {
  id: string;
  registered_at: string;
  parent_first_name: string;
  parent_last_name: string;
  primary_email: string;
  phone: string;
  county: string;
  city: string;
  privacy_policy_accepted: boolean;
  children: Array<{ id: string; first_name: string; last_name: string; cnp: string }>;
}

interface RegistrationsTableProps {
  data: RegistrationRowData[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onDeleteRequest?: (id: string) => Promise<void>;
  onBulkDeleteRequest?: (ids: string[]) => Promise<void>;
  onPageSizeChange?: (newSize: number) => void;
}

type DeleteTarget =
  | { type: 'single'; id: string; name: string }
  | { type: 'bulk'; ids: string[] };

const columnHelper = createColumnHelper<RegistrationRowData>();

export function RegistrationsTable({
  data,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  canEdit = false,
  canDelete = false,
  onDeleteRequest,
  onBulkDeleteRequest,
  onPageSizeChange,
}: RegistrationsTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Clear selection when data page changes
  React.useEffect(() => {
    setSelectedIds([]);
  }, [page, data]);

  const allPageIds = React.useMemo(() => data.map((d) => d.id), [data]);
  const isAllPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = React.useCallback(() => {
    if (isAllPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allPageIds])));
    }
  }, [isAllPageSelected, allPageIds]);

  const toggleSelectRow = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  async function handleExecuteDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single') {
        if (onDeleteRequest) {
          await onDeleteRequest(deleteTarget.id);
        }
      } else {
        if (onBulkDeleteRequest) {
          await onBulkDeleteRequest(deleteTarget.ids);
          setSelectedIds([]);
        }
      }
      setDeleteTarget(null);
    } catch {
      alert('A apărut o eroare la ștergerea înregistrărilor.');
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = React.useMemo(
    () => [
      ...(canDelete
        ? [
            columnHelper.display({
              id: 'select',
              header: () => (
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectAllPage}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  title="Selectează toate înregistrările din pagină"
                />
              ),
              cell: (info) => {
                const rowId = info.row.original.id;
                const isSelected = selectedIds.includes(rowId);
                return (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectRow(rowId)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                );
              },
            }),
          ]
        : []),
      columnHelper.accessor('registered_at', {
        header: 'Data Înregistrării',
        cell: (info) => {
          const dateStr = info.getValue();
          if (!dateStr) return 'N/A';
          const d = new Date(dateStr);
          return <span className="text-xs font-mono">{d.toLocaleDateString('ro-RO')}</span>;
        },
      }),
      columnHelper.accessor((row) => `${row.parent_last_name} ${row.parent_first_name}`, {
        id: 'parent_name',
        header: 'Părinte',
        cell: (info) => <span className="font-semibold text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('primary_email', {
        header: 'Email',
        cell: (info) => <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor('phone', {
        header: 'Telefon',
        cell: (info) => <span className="text-xs font-mono">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => `${row.county}, ${row.city}`, {
        id: 'location',
        header: 'Județ / Oraș',
        cell: (info) => <Badge variant="secondary" className="text-[11px] font-medium">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor('children', {
        header: 'Număr copii',
        cell: (info) => {
          const children = info.getValue() || [];
          const count = children.length;
          return (
            <Badge variant={count > 0 ? 'secondary' : 'outline'} className="text-xs font-semibold px-2.5 py-0.5 font-mono">
              {count} {count === 1 ? 'copil' : 'copii'}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('privacy_policy_accepted', {
        header: 'Politica Conf.',
        cell: (info) => {
          const accepted = info.getValue();
          return accepted ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> DA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-semibold">
              <XCircle className="w-3.5 h-3.5" /> NU
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Acțiuni',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <Link href={`/registrations/${row.id}`}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-indigo-600" title="Vezi detalii">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </Link>
              {canEdit && (
                <Link href={`/registrations/${row.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-indigo-600" title="Editează">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
              {canDelete && onDeleteRequest && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDeleteTarget({
                      type: 'single',
                      id: row.id,
                      name: `${row.parent_last_name} ${row.parent_first_name}`,
                    })
                  }
                  className="h-7 w-7 text-slate-400 hover:text-red-600"
                  title="Șterge"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    [canEdit, canDelete, onDeleteRequest, isAllPageSelected, selectedIds, toggleSelectAllPage, toggleSelectRow]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      {/* Bulk Selection Action Bar */}
      {canDelete && selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-red-50/90 dark:bg-red-950/80 border border-red-200 dark:border-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-all">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="destructive" className="font-mono text-xs">
              {selectedIds.length} {selectedIds.length === 1 ? 'înregistrare selectată' : 'înregistrări selectate'}
            </Badge>
            <span className="text-xs text-red-700 dark:text-red-300 font-medium">
              Puteți șterge toate înregistrările bifate simultan.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs bg-white dark:bg-slate-900"
            >
              Deselectează Tot
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteTarget({ type: 'bulk', ids: selectedIds })}
              className="h-8 text-xs font-semibold gap-1.5 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" /> Șterge Selectate ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Unified Custom Delete Confirmation Modal (Viewport Centered via Portal) */}
      {deleteTarget && mounted && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen w-screen top-0 left-0">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {deleteTarget.type === 'single' ? 'Ștergere Înregistrare' : 'Ștergere Multiplă Înregistrări'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {deleteTarget.type === 'single' ? (
                  <>Sunteți sigur că doriți să ștergeți înregistrarea pentru <strong>{deleteTarget.name}</strong>?</>
                ) : (
                  <>Sunteți sigur că doriți să ștergeți definitiv cele <strong>{deleteTarget.ids.length}</strong> înregistrări selectate?</>
                )}
                <br />
                <span className="text-red-500 font-medium">Această acțiune este ireversibilă și va fi înregistrată în jurnalul de audit.</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-xs"
              >
                Anulează
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="text-xs gap-1.5 bg-red-600 hover:bg-red-700 font-semibold"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Se șterge...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleteTarget.type === 'single' ? 'Confirmă Ștergerea' : `Confirmă Ștergerea (${deleteTarget.ids.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto min-w-full">
        <Table>
          <TableHeader className="bg-slate-50/70 dark:bg-slate-950/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-slate-300" />
                    <span>Nu au fost găsite înregistrări pentru filtrele selectate.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isSelected = selectedIds.includes(row.original.id);
                return (
                  <TableRow
                    key={row.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/50'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span>Pe pagină:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 rounded border border-slate-200 dark:border-slate-700 text-xs px-2 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
          <div>
            Se afișează <strong>{(page - 1) * pageSize + (data.length ? 1 : 0)}</strong> - <strong>{(page - 1) * pageSize + data.length}</strong> din <strong>{totalCount}</strong> înregistrări
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </Button>
          <span className="font-semibold px-2">Pagina {page} din {totalPages || 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 gap-1 text-xs"
          >
            Următor <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
