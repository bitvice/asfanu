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
  familyNumber?: string;
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

async function getChronologicalFamilyMap(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, number>> {
  const familyMap = new Map<string, number>();
  try {
    const { data } = await supabase
      .from('registrations')
      .select('id, registered_at')
      .order('registered_at', { ascending: true });

    if (data && data.length > 0) {
      data.forEach((r: { id: string }, idx: number) => {
        familyMap.set(r.id, idx + 1);
      });
    }
  } catch {
    // Quiet fallback
  }

  return familyMap;
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

  const hasFamilyNumFilter = Boolean(filters.familyNumber && filters.familyNumber.trim().length > 0);

  if (filters.search) {
    const rawSearch = filters.search.trim();
    const searchClean = `%${rawSearch}%`;
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

  query = query.order(sortColumn, { ascending: sortAsc });

  // Fetch full set if filtering by family number, otherwise fetch paginated range
  if (!hasFamilyNumFilter) {
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Eroare la preluarea înregistrărilor: ${error.message}`);
  }

  const rawList = (data as unknown as RegistrationWithChildren[]) || [];

  // Build unified chronological family_number map (oldest registration = #1)
  const familyMap = await getChronologicalFamilyMap(supabase);

  // Attach consistent family_number to each registration
  const listWithFamilyNumbers = rawList.map((reg, idx) => ({
    ...reg,
    family_number: reg.family_number || familyMap.get(reg.id) || (from + idx + 1),
  }));

  // Mask CNP for children if user is not authorized to view raw CNP
  let maskedData = listWithFamilyNumbers.map((reg) => ({
    ...reg,
    children: (reg.children || []).map((child: ChildRow) => ({
      ...child,
      cnp: canAccessUnmaskedCNP(userRole) ? child.cnp : maskCNP(child.cnp),
    })),
  }));

  // Filter by family number
  if (hasFamilyNumFilter && filters.familyNumber) {
    const rawClean = filters.familyNumber.trim().replace(/^#/, '');
    const cleanDigits = rawClean.replace(/^0+/, '');
    const numVal = parseInt(cleanDigits, 10);

    if (rawClean.length > 0) {
      maskedData = maskedData.filter((reg) => {
        if (!isNaN(numVal) && reg.family_number === numVal) return true;
        const formattedNum = String(reg.family_number).padStart(3, '0');
        return formattedNum.includes(rawClean) || String(reg.family_number).includes(rawClean);
      });
    }
  }

  const finalTotalCount = hasFamilyNumFilter ? maskedData.length : (count || 0);
  const paginatedData = hasFamilyNumFilter ? maskedData.slice(from, to + 1) : maskedData;

  return {
    registrations: paginatedData,
    totalCount: finalTotalCount,
    page,
    pageSize,
    totalPages: Math.ceil(finalTotalCount / pageSize) || 1,
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

  const familyMap = await getChronologicalFamilyMap(supabase);
  const familyNum = record.family_number || familyMap.get(record.id) || 1;

  return {
    ...record,
    family_number: familyNum,
    children: (record.children || []).map((child: ChildRow) => ({
      ...child,
      cnp: allowUnmasked ? child.cnp : maskCNP(child.cnp),
    })),
  };
}
