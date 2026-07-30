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
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { MaskedCNP } from './MaskedCNP';

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
  canUnmaskCNP?: boolean;
  onDeleteRequest?: (id: string) => Promise<void>;
  onUnmaskChildCNP?: (childId: string) => Promise<string | null>;
}

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
  canUnmaskCNP = false,
  onDeleteRequest,
  onUnmaskChildCNP,
}: RegistrationsTableProps) {
  const columns = React.useMemo(
    () => [
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
        header: 'Copii & CNP Maskat',
        cell: (info) => {
          const children = info.getValue() || [];
          if (children.length === 0) return <span className="text-xs text-slate-400">Fără copii</span>;
          return (
            <div className="flex flex-col gap-1">
              {children.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{c.last_name} {c.first_name}:</span>
                  <MaskedCNP
                    cnp={c.cnp}
                    canUnmask={canUnmaskCNP}
                    onUnmaskRequest={onUnmaskChildCNP ? () => onUnmaskChildCNP(c.id) : undefined}
                  />
                </div>
              ))}
            </div>
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
                  onClick={() => {
                    if (confirm('Sunteți sigur că doriți să ștergeți această înregistrare?')) {
                      onDeleteRequest(row.id);
                    }
                  }}
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
    [canEdit, canDelete, canUnmaskCNP, onDeleteRequest, onUnmaskChildCNP]
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <div>
          Se afișează <strong>{(page - 1) * pageSize + (data.length ? 1 : 0)}</strong> - <strong>{(page - 1) * pageSize + data.length}</strong> din <strong>{totalCount}</strong> înregistrări
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
