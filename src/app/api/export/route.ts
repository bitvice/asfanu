import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/auth.service';
import { canExportData } from '@/lib/security/permissions';
import { logAuditEvent } from '@/lib/security/audit';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const runtime = 'nodejs';

interface ExportChild {
  first_name: string;
  last_name: string;
  birth_date?: string | null;
}

interface ExportRegistration {
  registered_at: string;
  parent_first_name: string;
  parent_last_name: string;
  primary_email: string;
  secondary_email?: string | null;
  phone: string;
  county: string;
  city: string;
  postal_address?: string | null;
  postal_code?: string | null;
  privacy_policy_accepted: boolean;
  source: string;
  comments?: string | null;
  internal_notes?: string | null;
  children?: ExportChild[];
}

function formatChildren(children: ExportChild[] = []) {
  return children
    .map((child) => {
      const birthYear = child.birth_date?.match(/^\d{4}/)?.[0];
      return `${child.last_name} ${child.first_name}${birthYear ? ` (${birthYear})` : ''}`;
    })
    .join(', ');
}

function stripRomanianDiacritics(value: string) {
  return value
    .replace(/[ăâ]/g, 'a')
    .replace(/[ĂÂ]/g, 'A')
    .replace(/î/g, 'i')
    .replace(/Î/g, 'I')
    .replace(/[șş]/g, 's')
    .replace(/[ȘŞ]/g, 'S')
    .replace(/[țţ]/g, 't')
    .replace(/[ȚŢ]/g, 'T');
}

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || !canExportData(profile.role)) {
      return NextResponse.json({ error: 'Neautorizat pentru export de date.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'pdf' ? 'pdf' : 'xlsx';
    const search = searchParams.get('search');
    const county = searchParams.get('county');
    const city = searchParams.get('city');
    const privacyPolicy = searchParams.get('privacyPolicyAccepted');

    const supabase = await createClient();
    let query = supabase
      .from('registrations')
      .select('*, children(first_name, last_name, birth_date)')
      .order('registered_at', { ascending: false });

    if (search) {
      const clean = `%${search.trim()}%`;
      query = query.or(
        `parent_first_name.ilike.${clean},parent_last_name.ilike.${clean},primary_email.ilike.${clean},phone.ilike.${clean}`
      );
    }
    if (county) query = query.eq('county', county);
    if (city) query = query.eq('city', city);
    if (privacyPolicy === 'true' || privacyPolicy === 'false') {
      query = query.eq('privacy_policy_accepted', privacyPolicy === 'true');
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: `Eroare la generarea exportului: ${error.message}` }, { status: 500 });
    }

    const registrations = (data || []) as unknown as ExportRegistration[];
    const exportRows = registrations.map((reg) => ({
      'Data Înregistrării': reg.registered_at ? new Date(reg.registered_at).toLocaleDateString('ro-RO') : '',
      'Nume Părinte': reg.parent_last_name,
      'Prenume Părinte': reg.parent_first_name,
      'Email Principal': reg.primary_email,
      'Email Secundar': reg.secondary_email || '',
      'Telefon': reg.phone || '',
      'Județ': reg.county,
      'Oraș': reg.city,
      'Adresă Poștală': reg.postal_address || '',
      'Cod Poștal': reg.postal_code || '',
      'Copii': formatChildren(reg.children),
      'Politica Confidențialitate': reg.privacy_policy_accepted ? 'DA' : 'NU',
      'Comentarii': reg.comments || '',
      'Observații': reg.internal_notes || '',
      'Sursă': reg.source,
    }));

    await logAuditEvent({
      userId: profile.id,
      action: 'EXPORT_REGISTRATIONS',
      entityType: 'registration',
      metadata: { format, row_count: exportRows.length, contains_cnp: false },
    });

    const dateSuffix = new Date().toISOString().slice(0, 10);

    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(16);
      doc.text('Lista inregistrari familii', 14, 15);
      doc.setFontSize(8);
      doc.setTextColor(90);
      doc.text(`Generat la ${new Date().toLocaleString('ro-RO')} · ${exportRows.length} inregistrari`, 14, 21);

      const pdfHeaders = ['Data', 'Familie', 'Email', 'Telefon', 'Localitate', 'Adresa / cod postal', 'Copii', 'Acord'];
      const pdfBody = registrations.map((reg) => [
        reg.registered_at ? new Date(reg.registered_at).toLocaleDateString('ro-RO') : '',
        `${reg.parent_last_name} ${reg.parent_first_name}`,
        reg.primary_email,
        reg.phone || '',
        `${reg.city}, ${reg.county}`,
        [reg.postal_address, reg.postal_code].filter(Boolean).join(' · '),
        formatChildren(reg.children),
        reg.privacy_policy_accepted ? 'DA' : 'NU',
      ].map((value) => stripRomanianDiacritics(value)));

      autoTable(doc, {
        startY: 26,
        head: [pdfHeaders],
        body: pdfBody,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak', valign: 'middle' },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 28 },
          5: { cellWidth: 55 },
          6: { cellWidth: 65 },
          7: { cellWidth: 12, halign: 'center' },
        },
        margin: { top: 14, right: 10, bottom: 12, left: 10 },
        didDrawPage: ({ pageNumber }) => {
          doc.setFontSize(7);
          doc.setTextColor(120);
          doc.text(`Pagina ${pageNumber}`, doc.internal.pageSize.getWidth() - 10, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
        },
      });

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="inregistrari-asfanu-${dateSuffix}.pdf"`,
        },
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = Object.keys(exportRows[0] || {}).map((header) => ({
      wch: Math.min(60, Math.max(header.length + 2, 16)),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Înregistrări');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inregistrari-asfanu-${dateSuffix}.xlsx"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'Eroare neașteptată la export.' }, { status: 500 });
  }
}
