import { createClient } from '@/lib/supabase/server';

export interface AuditParams {
  userId?: string;
  action: 'READ_CNP' | 'EXPORT_REGISTRATIONS' | 'CREATE_REGISTRATION' | 'UPDATE_REGISTRATION' | 'DELETE_REGISTRATION' | 'IMPORT_EXCEL' | 'UPDATE_USER_ROLE';
  entityType: 'registration' | 'child' | 'user' | 'import';
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(params: AuditParams): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId || user?.id || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
    });

    if (error) {
      // Internal logging only (no sensitive data printed)
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
