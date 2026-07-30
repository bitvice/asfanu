import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/security/audit';

export interface CreateImportSessionParams {
  fileName: string;
  fileSize: number;
  totalRows: number;
  mappingConfig: Record<string, unknown>;
  importedBy: string;
}

export async function createImportSession(params: CreateImportSessionParams) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('imports')
    .insert({
      file_name: params.fileName,
      file_size: params.fileSize,
      total_rows: params.totalRows,
      mapping_config: params.mappingConfig,
      imported_by: params.importedBy,
      status: 'processing',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Eroare la crearea sesiunii de import: ${error?.message}`);
  }

  await logAuditEvent({
    userId: params.importedBy,
    action: 'IMPORT_EXCEL',
    entityType: 'import',
    entityId: data.id,
    metadata: { file_name: params.fileName, total_rows: params.totalRows },
  });

  return data.id;
}

export async function updateImportSessionStatus(
  importId: string,
  stats: {
    successfulRows: number;
    failedRows: number;
    duplicateRows: number;
    status: 'completed' | 'completed_with_errors' | 'failed';
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('imports')
    .update({
      successful_rows: stats.successfulRows,
      failed_rows: stats.failedRows,
      duplicate_rows: stats.duplicateRows,
      status: stats.status,
      completed_at: new Date().toISOString(),
    })
    .eq('id', importId);

  if (error) {
    throw new Error(`Eroare la actualizarea stării de import: ${error.message}`);
  }
}
