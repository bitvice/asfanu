'use client';

import * as React from 'react';
import { fetchImportHistoryAction } from '@/features/imports/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Plus, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ImportSession {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  duplicate_rows: number;
  started_at: string;
  completed_at?: string;
}

export default function ImportsPage() {
  const [imports, setImports] = React.useState<ImportSession[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchImportHistoryAction();
      setImports(data as unknown as ImportSession[]);
    } catch {
      // Quiet error handle
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Istoric Importuri Excel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitorizați sesiunile de import și rapoartele de procesare ale fișierelor Excel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reîmprospătează
          </Button>
          <Link href="/imports/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-semibold shadow-sm">
              <Plus className="w-4 h-4" />
              Pornește Import Nou
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Sesiuni de Import Înregistrate</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Se încarcă istoricul de importuri...
            </div>
          ) : imports.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <FileSpreadsheet className="w-8 h-8 text-slate-300" />
              <span>Nu există nicio sesiune de import înregistrată încă.</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-950">
                <TableRow>
                  <TableHead className="text-xs">Data & Ora</TableHead>
                  <TableHead className="text-xs">Nume Fișier</TableHead>
                  <TableHead className="text-xs">Dimensiune</TableHead>
                  <TableHead className="text-xs">Stare Import</TableHead>
                  <TableHead className="text-xs text-center">Total Rânduri</TableHead>
                  <TableHead className="text-xs text-center">Succes</TableHead>
                  <TableHead className="text-xs text-center">Duplicate</TableHead>
                  <TableHead className="text-xs text-center">Eșuate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-xs font-mono">
                      {new Date(session.started_at).toLocaleString('ro-RO')}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{session.file_name}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {(session.file_size / 1024).toFixed(1)} KB
                    </TableCell>
                    <TableCell className="text-xs">
                      {session.status === 'completed' && (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Finalizat
                        </Badge>
                      )}
                      {session.status === 'completed_with_errors' && (
                        <Badge variant="warning" className="gap-1 text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Cu Avertismente
                        </Badge>
                      )}
                      {session.status === 'failed' && (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <XCircle className="w-3 h-3" /> Eșuat
                        </Badge>
                      )}
                      {session.status === 'processing' && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">În Procesare</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-center">{session.total_rows}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-emerald-600 text-center">{session.successful_rows}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-amber-600 text-center">{session.duplicate_rows}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-red-600 text-center">{session.failed_rows}</TableCell>
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
