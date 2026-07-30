'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/auth.service';
import { canViewAuditLogs } from '@/lib/security/permissions';

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}

export async function fetchAuditLogsAction(): Promise<AuditLogItem[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canViewAuditLogs(profile.role)) {
    throw new Error('Acces restricționat. Doar administratorii pot vizualiza jurnalul de audit.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles (email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Eroare la preluarea jurnalului de audit: ${error.message}`);
  }

  return (data || []).map((item) => {
    const prof = item.profiles as unknown as { email?: string; full_name?: string } | null;
    return {
      id: item.id,
      user_id: item.user_id,
      action: item.action,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      metadata: (item.metadata || {}) as Record<string, unknown>,
      created_at: item.created_at,
      user_email: prof?.email || prof?.full_name || 'Sistem / Necunoscut',
    };
  });
}
