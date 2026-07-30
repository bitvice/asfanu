import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/lib/security/cnp-masker';

export async function getUsers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Eroare la preluarea utilizatorilor: ${error.message}`);
  }

  return data || [];
}

export async function updateUserRole(targetUserId: string, newRole: UserRole) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Eroare la actualizarea rolului utilizatorului: ${error.message}`);
  }
}
