import { createClient } from '@/lib/supabase/server';
import { maskCNP, canAccessUnmaskedCNP, UserRole } from '@/lib/security/cnp-masker';
import { logAuditEvent } from '@/lib/security/audit';
import { Database } from '@/types/database.types';

type RegistrationRow = Database['public']['Tables']['registrations']['Row'];
type ChildRow = Database['public']['Tables']['children']['Row'];

export interface RegistrationWithChildren extends RegistrationRow {
  children: ChildRow[];
}

export interface RegistrationFilters {
  search?: string;
  county?: string;
  city?: string;
  privacyPolicyAccepted?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getRegistrations(filters: RegistrationFilters = {}, userRole: UserRole = 'viewer') {
  const supabase = await createClient();
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('registrations')
    .select(`
      *,
      children (*)
    `, { count: 'exact' });

  if (filters.search) {
    const searchClean = `%${filters.search.trim()}%`;
    query = query.or(
      `parent_first_name.ilike.${searchClean},parent_last_name.ilike.${searchClean},primary_email.ilike.${searchClean},phone.ilike.${searchClean}`
    );
  }

  if (filters.county) {
    query = query.eq('county', filters.county);
  }

  if (filters.city) {
    query = query.eq('city', filters.city);
  }

  if (typeof filters.privacyPolicyAccepted === 'boolean') {
    query = query.eq('privacy_policy_accepted', filters.privacyPolicyAccepted);
  }

  if (filters.startDate) {
    query = query.gte('registered_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('registered_at', filters.endDate);
  }

  const sortColumn = filters.sortBy || 'registered_at';
  const sortAsc = filters.sortOrder === 'asc';

  query = query.order(sortColumn, { ascending: sortAsc }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Eroare la preluarea înregistrărilor: ${error.message}`);
  }

  const rawList = (data as unknown as RegistrationWithChildren[]) || [];

  // Mask CNP for children if user is not authorized to view raw CNP
  const maskedData = rawList.map((reg: RegistrationWithChildren) => ({
    ...reg,
    children: (reg.children || []).map((child: ChildRow) => ({
      ...child,
      cnp: canAccessUnmaskedCNP(userRole) ? child.cnp : maskCNP(child.cnp),
    })),
  }));

  return {
    registrations: maskedData,
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getRegistrationById(id: string, userRole: UserRole = 'viewer', requestUnmaskedCNP = false) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      children (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('Înregistrarea nu a fost găsită sau nu aveți permisiuni de acces.');
  }

  const record = data as unknown as RegistrationWithChildren;
  const allowUnmasked = requestUnmaskedCNP && canAccessUnmaskedCNP(userRole);

  if (allowUnmasked) {
    // Audit logging for viewing unmasked CNP
    await logAuditEvent({
      action: 'READ_CNP',
      entityType: 'registration',
      entityId: id,
      metadata: { requested_by_role: userRole },
    });
  }

  return {
    ...record,
    children: (record.children || []).map((child: ChildRow) => ({
      ...child,
      cnp: allowUnmasked ? child.cnp : maskCNP(child.cnp),
    })),
  };
}
