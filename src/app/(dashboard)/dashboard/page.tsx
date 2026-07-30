import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, FileCheck, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panou Principal</h1>
        <p className="text-sm text-slate-500">
          Privire de ansamblu asupra înregistrărilor familiilor și copiilor.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Înregistrări
            </CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Familii înregistrate în sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Copii
            </CardTitle>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Copii asociați înregistrărilor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Importuri Excel
            </CardTitle>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Sesiuni de import procesate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              CNP Lipsă / Incomplet
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-slate-500 mt-1">Înregistrări ce necesită atenție</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Card */}
      <Card className="border-dashed border-indigo-200 bg-indigo-50/50">
        <CardHeader>
          <CardTitle className="text-indigo-950">Acțiuni Rapide</CardTitle>
          <CardDescription>
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Adaugă Înregistrare Manuală
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
