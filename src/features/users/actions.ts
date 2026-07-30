'use server';

import { getCurrentUserProfile } from '@/services/auth.service';
import { canManageUsers } from '@/lib/security/permissions';
import { getUsers, updateUserRole } from '@/services/user.service';
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
