import { createClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
  totalRegistrations: number;
  totalChildren: number;
  totalImports: number;
  incompleteCNPCount: number;
  missingEmailCount: number;
  missingPhoneCount: number;
  noPrivacyCount: number;
  registrationsByCounty: Array<{ county: string; count: number }>;
  registrationsByCity: Array<{ city: string; count: number }>;
  recentImports: Array<{ id: string; file_name: string; total_rows: number; successful_rows: number; started_at: string; status: string }>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // 1. Total registrations & children counts
  const { count: totalRegistrations } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true });

  const { count: totalChildren } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true });

  const { count: totalImports } = await supabase
    .from('imports')
    .select('*', { count: 'exact', head: true });

  // 2. Data Quality counters
  const { count: noPrivacyCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('privacy_policy_accepted', false);

  const { count: missingEmailCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .or('primary_email.is.null,primary_email.eq.""');

  const { count: missingPhoneCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .or('phone.is.null,phone.eq.""');

  // Count children with invalid/missing CNP (<13 digits)
  const { data: childrenData } = await supabase.from('children').select('cnp');
  const incompleteCNPCount = (childrenData || []).filter(
    (c) => !c.cnp || c.cnp.trim().length !== 13
  ).length;

  // 3. Geographic aggregations
  const { data: allRegs } = await supabase.from('registrations').select('county, city');

  const countyMap: Record<string, number> = {};
  const cityMap: Record<string, number> = {};

  (allRegs || []).forEach((reg) => {
    const countyKey = reg.county || 'Nespecificat';
    const cityKey = reg.city || 'Nespecificat';
    countyMap[countyKey] = (countyMap[countyKey] || 0) + 1;
    cityMap[cityKey] = (cityMap[cityKey] || 0) + 1;
  });

  const registrationsByCounty = Object.entries(countyMap)
    .map(([county, count]) => ({ county, count }))
    .sort((a, b) => b.count - a.count);

  const registrationsByCity = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);

  // 4. Recent Imports
  const { data: recentImportsData } = await supabase
    .from('imports')
    .select('id, file_name, total_rows, successful_rows, started_at, status')
    .order('started_at', { ascending: false })
    .limit(5);

  return {
    totalRegistrations: totalRegistrations || 0,
    totalChildren: totalChildren || 0,
    totalImports: totalImports || 0,
    incompleteCNPCount,
    missingEmailCount: missingEmailCount || 0,
    missingPhoneCount: missingPhoneCount || 0,
    noPrivacyCount: noPrivacyCount || 0,
    registrationsByCounty,
    registrationsByCity,
    recentImports: (recentImportsData || []) as DashboardMetrics['recentImports'],
  };
}
