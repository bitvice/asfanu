'use client';

import * as React from 'react';
import { parseExcelFile, ParsedHeader } from '@/lib/import/excel-parser';
import { generateAutoMapping } from '@/lib/import/auto-mapper';
import { HeaderMapper } from './HeaderMapper';
import { normalizeString, normalizeEmail, normalizeBoolean, parseRomanianDate, normalizeCityCounty } from '@/lib/import/normalizer';
import { normalizePhone } from '@/lib/validation/phone';
import { validateCNP } from '@/lib/validation/cnp';
import { detectDuplicateRecord, DuplicateConfidence } from '@/lib/import/duplicate-detector';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileSpreadsheet, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { extractChildrenFromText } from '@/lib/import/children-parser';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export interface ProcessedRow {
  rowNumber: number;
  rawData: Record<string, unknown>;
  normalized: {
    parent_first_name: string;
    parent_last_name: string;
    primary_email: string;
    secondary_email?: string;
    phone: string;
    postal_address?: string;
    county: string;
    city: string;
    comments?: string;
    privacy_policy_accepted: boolean;
    registered_at?: string;
    family_details?: string;
    notification_email?: string;
    internal_notes?: string;
    child_first_name?: string;
    child_last_name?: string;
    child_email?: string;
    child_cnp?: string;
    extractedChildren?: Array<{
      first_name: string;
      last_name: string;
      cnp?: string;
      age?: number;
      birth_date?: string;
      email?: string;
    }>;
  };
  validationErrors: string[];
  duplicateConfidence: DuplicateConfidence;
  duplicateMatchId?: string;
  duplicateReason?: string;
  action: 'import' | 'skip' | 'update';
}

interface ImportWizardProps {
  existingRegistrations: Array<{
    id: string;
    parent_first_name: string;
    parent_last_name: string;
    primary_email: string;
    phone: string;
    county: string;
    city: string;
    children: Array<{ cnp: string }>;
  }>;
  onExecuteImportAction: (
    fileInfo: { fileName: string; fileSize: number },
    mapping: Record<string, string>,
    rows: ProcessedRow[]
  ) => Promise<{ success: boolean; importId: string; summary: { successful: number; failed: number; duplicates: number } }>;
}

export function ImportWizard({ existingRegistrations, onExecuteImportAction }: ImportWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<number>(1);
  const [file, setFile] = React.useState<File | null>(null);
  const [headers, setHeaders] = React.useState<ParsedHeader[]>([]);
  const [rawRows, setRawRows] = React.useState<Array<Record<string, unknown>>>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [processedRows, setProcessedRows] = React.useState<ProcessedRow[]>([]);
  const [parsing, setParsing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [importSummary, setImportSummary] = React.useState<{ successful: number; failed: number; duplicates: number } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Step 1: File Upload Handler
  async function handleFileUpload(selectedFile: File) {
    setErrorMsg(null);
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMsg('Vă rugăm să selectați un fișier Excel valid (.xlsx, .xls) sau CSV.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('Dimensiunea fișierului depășește limita maximă de 10 MB.');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const parsed = parseExcelFile(Buffer.from(arrayBuffer));
      setHeaders(parsed.headers);
      setRawRows(parsed.rawRows);

      const autoMap = generateAutoMapping(parsed.headers);
      setMapping(autoMap);
      setStep(2); // Go to Header Mapping step
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Eroare la citirea fișierului Excel.');
    } finally {
      setParsing(false);
    }
  }

  // Step 5 & 6 & 7: Process & Validate Rows
  function processRows() {
    const rows: ProcessedRow[] = rawRows.map((rawRow, idx) => {
      const rowNumber = (rawRow._rowNumber as number) || idx + 2;

      // Extract values based on mapping
      const getVal = (targetField: string) => {
        const headerKey = Object.keys(mapping).find((key) => mapping[key] === targetField);
        return headerKey ? rawRow[headerKey] : '';
      };

      const parentFirstName = normalizeString(getVal('parent_first_name'));
      const parentLastName = normalizeString(getVal('parent_last_name'));
      const primaryEmail = normalizeEmail(getVal('primary_email'));
      const secondaryEmail = normalizeEmail(getVal('secondary_email'));
      const rawPhone = normalizeString(getVal('phone'));
      const phoneRes = normalizePhone(rawPhone);
      const county = normalizeCityCounty(getVal('county'));
      const city = normalizeCityCounty(getVal('city'));
      const postalAddress = normalizeString(getVal('postal_address'));
      const comments = normalizeString(getVal('comments'));
      const privacyAccepted = normalizeBoolean(getVal('privacy_policy_accepted'));
      const registeredAt = parseRomanianDate(getVal('registered_at')) || new Date().toISOString();
      const familyDetails = normalizeString(getVal('family_details'));
      const notificationEmail = normalizeEmail(getVal('notification_email'));
      const internalNotes = normalizeString(getVal('internal_notes'));

      const childFirstName = normalizeString(getVal('child_first_name'));
      const childLastName = normalizeString(getVal('child_last_name')) || parentLastName;
      const childEmail = normalizeEmail(getVal('child_email'));
      const childCnp = normalizeString(getVal('child_cnp'));

      const familyText = [familyDetails, internalNotes, comments].filter(Boolean).join(' | ');
      const extractedChildren = extractChildrenFromText(familyText, parentLastName, {
        first_name: childFirstName,
        cnp: childCnp,
        email: childEmail,
      });

      const errors: string[] = [];
      if (!parentFirstName) errors.push('Prenumele părintelui este obligatoriu.');
      if (!parentLastName) errors.push('Numele de familie al părintelui este obligatoriu.');
      if (!primaryEmail || !primaryEmail.includes('@')) errors.push('Email-ul principal este invalid.');
      if (rawPhone && !phoneRes.isValid) errors.push(phoneRes.error || 'Număr de telefon invalid.');
      if (!county) errors.push('Județul este obligatoriu.');
      if (!city) errors.push('Orașul este obligatoriu.');

      if (childCnp) {
        const cnpRes = validateCNP(childCnp);
        if (!cnpRes.isValid) {
          errors.push(`CNP copil invalid: ${cnpRes.error}`);
        }
      }

      // Duplicate Check against existing DB records
      const dupCheck = detectDuplicateRecord(
        {
          parent_first_name: parentFirstName,
          parent_last_name: parentLastName,
          primary_email: primaryEmail,
          phone: phoneRes.normalized || rawPhone,
          county,
          city,
          children: childCnp ? [{ cnp: childCnp }] : [],
        },
        existingRegistrations
      );

      return {
        rowNumber,
        rawData: rawRow,
        normalized: {
          parent_first_name: parentFirstName,
          parent_last_name: parentLastName,
          primary_email: primaryEmail,
          secondary_email: secondaryEmail || undefined,
          phone: phoneRes.normalized || rawPhone,
          postal_address: postalAddress || undefined,
          county,
          city,
          comments: comments || undefined,
          privacy_policy_accepted: privacyAccepted,
          registered_at: registeredAt,
          family_details: familyDetails || undefined,
          notification_email: notificationEmail || undefined,
          internal_notes: internalNotes || undefined,
          child_first_name: childFirstName || undefined,
          child_last_name: childLastName || undefined,
          child_email: childEmail || undefined,
          child_cnp: childCnp || undefined,
          extractedChildren,
        },
        validationErrors: errors,
        duplicateConfidence: dupCheck.confidence,
        duplicateMatchId: dupCheck.matchRecordId,
        duplicateReason: dupCheck.reason,
        action: errors.length > 0 ? 'skip' : dupCheck.confidence === 'exact_duplicate' ? 'skip' : 'import',
      };
    });

    setProcessedRows(rows);
    setStep(3); // Go to Preview & Validation step
  }

  async function handleConfirmImport() {
    if (!file) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await onExecuteImportAction(
        { fileName: file.name, fileSize: file.size },
        mapping,
        processedRows
      );

      if (res.success) {
        setImportSummary(res.summary);
        setStep(4); // Go to Summary step
      }
    } catch {
      setErrorMsg('A apărut o eroare neașteptată la executarea importului.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* Fullscreen Spinner Overlay during Excel parsing or DB batch import */}
      {(parsing || submitting) && mounted && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 min-h-screen w-screen top-0 left-0">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {parsing ? 'Se analizează fișierul Excel...' : 'Se importă datele în baza de date...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Vă rugăm să nu închideți această fereastră. Operarea este în desfășurare.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Wizard Progress Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono">
            Pasul {step} din 4
          </Badge>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {step === 1 && '1. Selectare Fișier Excel'}
            {step === 2 && '2. Mapare Coloane & Disambiguizare'}
            {step === 3 && '3. Previzualizare, Validare & Duplicate'}
            {step === 4 && '4. Sumar Final Import'}
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: FILE UPLOAD */}
      {step === 1 && (
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-12 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Incarcă Fișierul Excel cu Înregistrări
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sunt acceptate fișiere .xlsx, .xls sau .csv de maxim 10 MB.
              </p>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Alege Fișierul din PC
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: HEADER MAPPER */}
      {step === 2 && (
        <div className="space-y-4">
          <HeaderMapper headers={headers} mapping={mapping} onMappingChange={setMapping} />
          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1 text-xs">
              <ArrowLeft className="w-4 h-4" /> Înapoi
            </Button>
            <Button size="sm" onClick={processRows} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs">
              Validează Datele & Continuă <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW, VALIDATION & DUPLICATE RESOLUTION */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Rezultat Validare & Previzualizare Date ({processedRows.length} Rânduri)</CardTitle>
              <div className="flex gap-2 text-xs">
                <Badge variant="success">Valide: {processedRows.filter(r => r.validationErrors.length === 0 && !r.duplicateConfidence).length}</Badge>
                <Badge variant="warning">Duplicate: {processedRows.filter(r => r.duplicateConfidence).length}</Badge>
                <Badge variant="destructive">Invalide: {processedRows.filter(r => r.validationErrors.length > 0).length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto border-t border-slate-200 dark:border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-950">
                    <TableRow>
                      <TableHead className="text-xs">Rând</TableHead>
                      <TableHead className="text-xs">Părinte</TableHead>
                      <TableHead className="text-xs">Email / Telefon</TableHead>
                      <TableHead className="text-xs">Copil & CNP</TableHead>
                      <TableHead className="text-xs text-center">Nr. copii</TableHead>
                      <TableHead className="text-xs">Stare / Erori</TableHead>
                      <TableHead className="text-xs">Acțiune</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRows.map((row) => (
                      <TableRow key={row.rowNumber} className={row.validationErrors.length > 0 ? 'bg-red-50/40 dark:bg-red-950/20' : ''}>
                        <TableCell className="text-xs font-mono font-bold">#{row.rowNumber}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {row.normalized.parent_last_name} {row.normalized.parent_first_name}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <div>{row.normalized.primary_email}</div>
                          <div className="text-slate-500">{row.normalized.phone}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.normalized.child_first_name ? (
                            <div>
                              <span className="font-semibold">{row.normalized.child_first_name}</span>
                              <div className="font-mono text-[11px] text-slate-500">{row.normalized.child_cnp}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono font-semibold">
                          {row.normalized.extractedChildren?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.validationErrors.length > 0 ? (
                            <div className="text-red-600 dark:text-red-400 font-semibold space-y-0.5">
                              {row.validationErrors.map((err, i) => (
                                <div key={i} className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" /> {err}</div>
                              ))}
                            </div>
                          ) : row.duplicateConfidence ? (
                            <Badge variant="warning" className="text-[10px]">
                              Duplicat ({row.duplicateReason})
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">Valid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <select
                            value={row.action}
                            onChange={(e) => {
                              const newAction = e.target.value as 'import' | 'skip' | 'update';
                              setProcessedRows(processedRows.map(r => r.rowNumber === row.rowNumber ? { ...r, action: newAction } : r));
                            }}
                            className="h-7 rounded border border-slate-200 dark:border-slate-700 text-xs px-1 bg-white dark:bg-slate-950"
                          >
                            <option value="import">Importă</option>
                            <option value="skip">Ignoră (Skip)</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1 text-xs">
              <ArrowLeft className="w-4 h-4" /> Înapoi la Mapare
            </Button>
            <Button
              size="sm"
              disabled={submitting || processedRows.filter(r => r.action === 'import').length === 0}
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Se execută importul...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Execută Importul ({processedRows.filter(r => r.action === 'import').length} Rânduri)
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT SUMMARY REPORT */}
      {step === 4 && importSummary && (
        <Card className="text-center p-8 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Import Finalizat cu Succes!</h2>
            <p className="text-xs text-slate-500 mt-1">Sesiunea de import a fost înregistrată în baza de date.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 max-w-xl mx-auto pt-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="block text-2xl font-bold text-emerald-700 dark:text-emerald-300">{importSummary.successful}</span>
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Rânduri Importate</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <span className="block text-2xl font-bold text-amber-700 dark:text-amber-300">{importSummary.duplicates}</span>
              <span className="text-xs font-medium text-amber-800 dark:text-amber-400">Duplicate Ignorate</span>
            </div>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
              <span className="block text-2xl font-bold text-red-700 dark:text-red-300">{importSummary.failed}</span>
              <span className="text-xs font-medium text-red-800 dark:text-red-400">Rânduri Invalide</span>
            </div>
          </div>

          <CardFooter className="justify-center pt-6">
            <Button onClick={() => router.push('/registrations')} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs">
              Vezi Registrul de Înregistrări
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
