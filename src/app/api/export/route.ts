import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/auth.service';
import { canExportData } from '@/lib/security/permissions';
import { maskCNP, canAccessUnmaskedCNP } from '@/lib/security/cnp-masker';
import { logAuditEvent } from '@/lib/security/audit';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || !canExportData(profile.role)) {
      return NextResponse.json({ error: 'Neautorizat pentru export de date.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';
    const search = searchParams.get('search');
    const county = searchParams.get('county');
    const city = searchParams.get('city');

    const supabase = await createClient();
    let query = supabase.from('registrations').select(`
      *,
      children (*)
    `);

    if (search) {
      const clean = `%${search.trim()}%`;
      query = query.or(
        `parent_first_name.ilike.${clean},parent_last_name.ilike.${clean},primary_email.ilike.${clean},phone.ilike.${clean}`
      );
    }

    if (county) query = query.eq('county', county);
    if (city) query = query.eq('city', city);

    const { data: registrations, error } = await query;

    if (error) {
      return NextResponse.json({ error: `Eroare la generarea exportului: ${error.message}` }, { status: 500 });
    }

    const allowUnmasked = canAccessUnmaskedCNP(profile.role);

    // Flatten rows for spreadsheet export
    const exportRows: Array<Record<string, unknown>> = [];

    (registrations || []).forEach((reg) => {
      const childrenList = reg.children || [];
      if (childrenList.length === 0) {
        exportRows.push({
          'Data Înregistrării': reg.registered_at ? new Date(reg.registered_at).toLocaleDateString('ro-RO') : '',
          'Nume Părinte': reg.parent_last_name,
          'Prenume Părinte': reg.parent_first_name,
          'Email Principal': reg.primary_email,
          'Email Secundar': reg.secondary_email || '',
          'Telefon': reg.phone,
          'Județ': reg.county,
          'Oraș': reg.city,
          'Adresă Poștală': reg.postal_address || '',
          'Politica Confidențialitate': reg.privacy_policy_accepted ? 'DA' : 'NU',
          'Nume Copil': '',
          'Prenume Copil': '',
          'CNP Copil': '',
          'Sursă': reg.source,
        });
      } else {
        childrenList.forEach((c: { first_name: string; last_name: string; cnp: string }) => {
          exportRows.push({
            'Data Înregistrării': reg.registered_at ? new Date(reg.registered_at).toLocaleDateString('ro-RO') : '',
            'Nume Părinte': reg.parent_last_name,
            'Prenume Părinte': reg.parent_first_name,
            'Email Principal': reg.primary_email,
            'Email Secundar': reg.secondary_email || '',
            'Telefon': reg.phone,
            'Județ': reg.county,
            'Oraș': reg.city,
            'Adresă Poștală': reg.postal_address || '',
            'Politica Confidențialitate': reg.privacy_policy_accepted ? 'DA' : 'NU',
            'Nume Copil': c.last_name,
            'Prenume Copil': c.first_name,
            'CNP Copil': allowUnmasked ? c.cnp : maskCNP(c.cnp),
            'Sursă': reg.source,
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Înregistrări');

    await logAuditEvent({
      userId: profile.id,
      action: 'EXPORT_REGISTRATIONS',
      entityType: 'registration',
      metadata: { format, row_count: exportRows.length, unmasked_cnp: allowUnmasked },
    });

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="inregistrari-asfanu.csv"',
        },
      });
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="inregistrari-asfanu.xlsx"',
        },
      });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'Eroare neașteptată la export.' }, { status: 500 });
  }
}
