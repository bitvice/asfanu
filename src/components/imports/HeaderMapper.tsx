'use client';

import * as React from 'react';
import { ParsedHeader } from '@/lib/import/excel-parser';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export interface TargetFieldOption {
  value: string;
  label: string;
  category: 'parent' | 'child' | 'meta' | 'ignore';
}

export const TARGET_FIELDS: TargetFieldOption[] = [
  { value: 'registered_at', label: 'Data Înregistrării (registered_at)', category: 'meta' },
  { value: 'parent_last_name', label: 'Nume de familie Părinte (parent_last_name)', category: 'parent' },
  { value: 'parent_first_name', label: 'Prenume Părinte (parent_first_name)', category: 'parent' },
  { value: 'primary_email', label: 'Email Principal Părinte (primary_email)', category: 'parent' },
  { value: 'secondary_email', label: 'Email Secundar Părinte (secondary_email)', category: 'parent' },
  { value: 'phone', label: 'Telefon Părinte (phone)', category: 'parent' },
  { value: 'postal_address', label: 'Adresă Poștală (postal_address)', category: 'parent' },
  { value: 'county', label: 'Județ (county)', category: 'parent' },
  { value: 'city', label: 'Oraș (city)', category: 'parent' },
  { value: 'comments', label: 'Comentarii / Observații (comments)', category: 'parent' },
  { value: 'privacy_policy_accepted', label: 'Politica de Confidențialitate (privacy_policy_accepted)', category: 'meta' },
  { value: 'family_details', label: 'Date Familiale (family_details)', category: 'parent' },
  { value: 'notification_email', label: 'Email Primire Notificări (notification_email)', category: 'parent' },
  { value: 'internal_notes', label: 'Note Interne (internal_notes)', category: 'parent' },
  { value: 'child_last_name', label: 'Nume de familie Copil (child_last_name)', category: 'child' },
  { value: 'child_first_name', label: 'Prenume Copil (child_first_name)', category: 'child' },
  { value: 'child_email', label: 'Email Copil (child_email)', category: 'child' },
  { value: 'child_cnp', label: 'CNP Copil (child_cnp)', category: 'child' },
  { value: 'ignore', label: '-- Ignoră această coloană --', category: 'ignore' },
];

interface HeaderMapperProps {
  headers: ParsedHeader[];
  mapping: Record<string, string>;
  onMappingChange: (newMapping: Record<string, string>) => void;
}

export function HeaderMapper({ headers, mapping, onMappingChange }: HeaderMapperProps) {
  function handleSelect(headerKey: string, targetValue: string) {
    onMappingChange({
      ...mapping,
      [headerKey]: targetValue,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Mapare Coloane Excel → Câmpuri Bază de Date</span>
          <Badge variant="outline" className="text-xs">
            {headers.length} Coloane Identificate
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {headers.map((header) => {
          const selectedTarget = mapping[header.uniqueKey] || 'ignore';

          return (
            <div
              key={header.uniqueKey}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 md:w-1/2">
                <span className="font-bold text-slate-900 dark:text-slate-100">{header.uniqueKey}</span>
                {header.occurrenceIndex > 1 && (
                  <Badge variant="secondary" className="text-[10px]">
                    Duplicat #{header.occurrenceIndex}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 md:w-1/2">
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedTarget}
                  onChange={(e) => handleSelect(header.uniqueKey, e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                >
                  {TARGET_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                {selectedTarget !== 'ignore' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
