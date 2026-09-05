'use server';

import { getCurrentUserProfile } from '@/services/auth.service';
import { canManageUsers } from '@/lib/security/permissions';
import { getUsers, updateUserRole, createUser, getPublicAccounts } from '@/services/user.service';
import { UserRole } from '@/lib/security/cnp-masker';
import { logAuditEvent } from '@/lib/security/audit';
import { revalidatePath } from 'next/cache';

export async function fetchUsersAction() {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Nu aveți permisiunea de a vizualiza utilizatorii aplicației.');
  }

  return await getUsers();
}

export async function createUserAction(data: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return { error: 'Doar administratorii pot crea utilizatori noi.' };
  }

  if (!data.email || !data.password || !data.fullName) {
    return { error: 'Toate câmpurile (nume, email, parolă) sunt obligatorii.' };
  }

  try {
    const newUser = await createUser(data);

    await logAuditEvent({
      userId: profile.id,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: newUser.id,
      metadata: { email: data.email, role: data.role },
    });

    revalidatePath('/users');
    revalidatePath('/login');
    return { success: true, user: newUser };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Eroare la crearea utilizatorului.' };
  }
}

export async function fetchPublicAccountsAction() {
  try {
    return await getPublicAccounts();
  } catch {
    return [];
  }
}

export async function updateUserRoleAction(targetUserId: string, newRole: UserRole) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return { error: 'Doar administratorii pot modifica rolurile utilizatorilor.' };
  }

  try {
    await updateUserRole(targetUserId, newRole);

    await logAuditEvent({
      userId: profile.id,
      action: 'UPDATE_USER_ROLE',
      entityType: 'user',
      entityId: targetUserId,
      metadata: { new_role: newRole },
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Eroare la actualizarea rolului.' };
  }
}

