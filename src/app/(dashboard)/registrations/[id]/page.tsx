'use client';

import * as React from 'react';
import { fetchRegistrationByIdAction, getUnmaskedChildCNPAction } from '@/features/registrations/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MaskedCNP } from '@/components/registrations/MaskedCNP';
import { ChildEditDialog } from '@/components/registrations/ChildEditDialog';
import { ChildAddDialog } from '@/components/registrations/ChildAddDialog';
import { calculateCurrentAge, parseBirthDate } from '@/lib/children/age';
import { ArrowLeft, Edit, User, Phone, Mail, MapPin, Baby, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface RegistrationDetail {
  id: string;
  source: string;
  registered_at: string;
  parent_first_name: string;
  parent_last_name: string;
  primary_email: string;
  secondary_email?: string | null;
  phone: string;
  postal_address?: string | null;
  county: string;
  city: string;
  comments?: string | null;
  privacy_policy_accepted: boolean;
  family_details?: string | null;
  notification_email?: string | null;
  internal_notes?: string | null;
  children: Array<{ id: string; first_name: string; last_name: string; email?: string | null; cnp: string; age?: number | null; birth_date?: string | null }>;
}

export default function RegistrationDetailPage() {
  const [data, setData] = React.useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const regId = pathParts[pathParts.length - 1];
    if (regId && regId !== 'edit') {
      setId(regId);
    }
  }, []);

  const loadDetail = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRegistrationByIdAction(id, false);
      setData(res as unknown as RegistrationDetail);
    } catch {
      setError('Nu s-a putut încărca înregistrarea solicitată.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Se încarcă detaliile înregistrării...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-8 text-center">
        <p className="text-sm text-red-500">{error || 'Înregistrarea nu există.'}</p>
        <Link href="/registrations">
          <Button variant="outline" size="sm">Înapoi la registrul de înregistrări</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Actions & Title */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link href="/registrations">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Înapoi la înregistrări
            </Button>
          </Link>

          <Link href={`/registrations/${data.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold bg-white dark:bg-slate-900">
              <Edit className="w-3.5 h-3.5" /> Editează
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {data.parent_last_name} {data.parent_first_name}
          </h1>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact & Parent Info */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <User className="w-4 h-4" /> Date Părinte & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Principal:</span>
              <span className="font-semibold font-mono">{data.primary_email}</span>
            </div>
            {data.secondary_email && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Secundar:</span>
                <span className="font-mono">{data.secondary_email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon:</span>
              <span className="font-semibold font-mono">{data.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Locație:</span>
              <Badge variant="secondary">{data.county}, {data.city}</Badge>
            </div>
            {data.postal_address && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block mb-1">Adresă Poștală:</span>
                <p className="text-slate-800 dark:text-slate-200">{data.postal_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent & Audit Metadata */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Acord & Metadate Înregistrare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Politica de Confidențialitate:</span>
              {data.privacy_policy_accepted ? (
                <Badge variant="success">ACCEPTATĂ (DA)</Badge>
              ) : (
                <Badge variant="destructive">NEACCEPTATĂ (NU)</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sursă Înregistrare:</span>
              <Badge variant="outline" className="uppercase font-mono text-[10px]">{data.source}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Data Înregistrării:</span>
              <span className="font-mono">{new Date(data.registered_at).toLocaleDateString('ro-RO')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Section */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Baby className="w-4 h-4" /> Copii Asociați ({data.children.length})
          </CardTitle>
          <ChildAddDialog registrationId={data.id} parentLastName={data.parent_last_name} onSaved={loadDetail} />
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {data.children.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nu există copii înregistrați.</p>
          ) : (
            data.children.map((child) => {
              const birthDate = parseBirthDate(child.birth_date);
              const birthYear = birthDate?.getUTCFullYear();
              const currentAge = calculateCurrentAge(child.birth_date);

              return (
                <div
                  key={child.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{child.last_name} {child.first_name}</span>
                      {child.email && <span className="text-slate-500 block text-[11px]">{child.email}</span>}
                    </div>
                    <ChildEditDialog registrationId={data.id} child={child} onSaved={loadDetail} />
                  </div>

                  <div className="grid gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 sm:grid-cols-3">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-slate-400">Anul nașterii</span>
                      <span className="font-semibold">{birthYear ?? 'Nespecificat'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-slate-400">Vârsta curentă</span>
                      <span className="font-semibold">{currentAge !== null ? `${currentAge} ani` : 'Nespecificată'}</span>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-slate-500">CNP:</span>
                      <MaskedCNP
                        cnp={child.cnp}
                        canUnmask={true}
                        onUnmaskRequest={() => getUnmaskedChildCNPAction(child.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
