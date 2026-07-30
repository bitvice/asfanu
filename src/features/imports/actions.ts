'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/auth.service';
import { canImportExcel } from '@/lib/security/permissions';
import { createImportSession, updateImportSessionStatus } from '@/services/import.service';
import { ProcessedRow } from '@/components/imports/ImportWizard';
import { revalidatePath } from 'next/cache';

export async function executeBatchImportAction(
  fileInfo: { fileName: string; fileSize: number },
  mapping: Record<string, string>,
  rows: ProcessedRow[]
) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canImportExcel(profile.role)) {
    throw new Error('Nu aveți permisiunea de a executa importuri Excel.');
  }

  const importId = await createImportSession({
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    totalRows: rows.length,
    mappingConfig: mapping,
    importedBy: profile.id,
  });

  const supabase = await createClient();

  let successfulCount = 0;
  let failedCount = 0;
  let duplicateCount = 0;

  for (const row of rows) {
    if (row.action === 'skip') {
      if (row.duplicateConfidence) {
        duplicateCount++;
      } else {
        failedCount++;
      }

      await supabase.from('import_rows').insert({
        import_id: importId,
        row_number: row.rowNumber,
        status: row.duplicateConfidence ? 'duplicate' : 'skipped',
        raw_data: row.rawData,
        normalized_data: row.normalized,
        validation_errors: row.validationErrors,
        duplicate_confidence: row.duplicateConfidence || null,
      });

      continue;
    }

    // Process 'import' action
    try {
      const norm = row.normalized;
      const { data: reg, error: regError } = await supabase
        .from('registrations')
        .insert({
          source: 'excel_import',
          source_import_id: importId,
          source_row_number: row.rowNumber,
          registered_at: norm.registered_at || new Date().toISOString(),
          parent_first_name: norm.parent_first_name,
          parent_last_name: norm.parent_last_name,
          primary_email: norm.primary_email,
          secondary_email: norm.secondary_email || null,
          phone: norm.phone,
          postal_address: norm.postal_address || null,
          county: norm.county,
          city: norm.city,
          comments: norm.comments || null,
          privacy_policy_accepted: norm.privacy_policy_accepted,
          family_details: norm.family_details || null,
          notification_email: norm.notification_email || null,
          internal_notes: norm.internal_notes || null,
          created_by: profile.id,
          updated_by: profile.id,
        })
        .select('id')
        .single();

      if (regError || !reg) {
        failedCount++;
        await supabase.from('import_rows').insert({
          import_id: importId,
          row_number: row.rowNumber,
          status: 'failed',
          raw_data: row.rawData,
          validation_errors: [regError?.message || 'Eroare la inserarea înregistrării'],
        });
        continue;
      }

      // Insert all extracted child records
      const childrenToInsert = norm.extractedChildren && norm.extractedChildren.length > 0
        ? norm.extractedChildren
        : norm.child_first_name || norm.child_cnp
        ? [{
            first_name: norm.child_first_name || 'Copil 1',
            last_name: norm.child_last_name || norm.parent_last_name,
            email: norm.child_email || null,
            cnp: norm.child_cnp || '',
            age: undefined,
            birth_date: undefined,
          }]
        : [];

      for (const child of childrenToInsert) {
        await supabase.from('children').insert({
          registration_id: reg.id,
          first_name: child.first_name || 'Copil',
          last_name: child.last_name || norm.parent_last_name,
          email: child.email || null,
          cnp: child.cnp || '',
          age: child.age || null,
          birth_date: child.birth_date || null,
        });
      }

      successfulCount++;
      await supabase.from('import_rows').insert({
        import_id: importId,
        row_number: row.rowNumber,
        status: 'imported',
        raw_data: row.rawData,
        normalized_data: norm,
        registration_id: reg.id,
      });
    } catch {
      failedCount++;
    }
  }

  const finalStatus = failedCount > 0 ? 'completed_with_errors' : 'completed';
  await updateImportSessionStatus(importId, {
    successfulRows: successfulCount,
    failedRows: failedCount,
    duplicateRows: duplicateCount,
    status: finalStatus,
  });

  revalidatePath('/registrations');
  revalidatePath('/imports');

  return {
    success: true,
    importId,
    summary: {
      successful: successfulCount,
      failed: failedCount,
      duplicates: duplicateCount,
    },
  };
}

export async function fetchImportHistoryAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Eroare la preluarea istoricului de importuri: ${error.message}`);
  }

  return data || [];
}
