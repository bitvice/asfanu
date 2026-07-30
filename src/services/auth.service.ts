'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/security/cnp-masker';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email || 'Utilizator',
      role: (profile?.role as UserRole) || 'viewer',
    };
  } catch {
    return null;
  }
}

export async function loginWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Adresa de e-mail și parola sunt obligatorii.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Autentificare eșuată. Verificați email-ul și parola introdusă.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
