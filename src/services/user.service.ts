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

export async function createUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}) {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Try creating auth user via admin API
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
    },
  });

  let userId = authUser?.user?.id;

  if (authError) {
    // Fallback to signUp if admin.createUser is restricted
    const { data: signUpUser, error: signUpError } = await adminSupabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (signUpError && !signUpUser?.user) {
      throw new Error(`Eroare la crearea contului de utilizator: ${authError.message || signUpError.message}`);
    }

    userId = signUpUser?.user?.id;
  }

  if (!userId) {
    throw new Error('Nu s-a putut genera ID-ul utilizatorului.');
  }

  // Ensure profile record is stored in public.profiles table
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: data.fullName,
      email: data.email,
      role: data.role,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    throw new Error(`Eroare la salvarea profilului utilizatorului: ${profileError.message}`);
  }

  return { id: userId, email: data.email, fullName: data.fullName, role: data.role };
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

export async function getPublicAccounts() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}


