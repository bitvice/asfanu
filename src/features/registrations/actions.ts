'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/auth.service';
import {
  getRegistrations,
  getRegistrationById,
  RegistrationFilters,
} from '@/services/registration.service';
import { canEditRegistrations, canDeleteRegistrations } from '@/lib/security/permissions';
import { registrationSchema, RegistrationFormValues } from '@/lib/validation/registration.schema';
import { childDetailsSchema, ChildDetailsValues } from '@/lib/validation/child-details.schema';
import { calculateCurrentAge } from '@/lib/children/age';
import { logAuditEvent } from '@/lib/security/audit';
import { canAccessUnmaskedCNP } from '@/lib/security/cnp-masker';
import { revalidatePath } from 'next/cache';

export async function fetchRegistrationsAction(filters: RegistrationFilters) {
  const profile = await getCurrentUserProfile();
  const role = profile?.role || 'viewer';
  return await getRegistrations(filters, role);
}

export async function fetchRegistrationByIdAction(id: string, requestUnmasked = false) {
  const profile = await getCurrentUserProfile();
  const role = profile?.role || 'viewer';
  return await getRegistrationById(id, role, requestUnmasked);
}

export async function getUnmaskedChildCNPAction(childId: string): Promise<string | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessUnmaskedCNP(profile.role)) {
    return null;
  }

  const supabase = await createClient();
  const { data: child } = await supabase
    .from('children')
    .select('cnp, registration_id')
    .eq('id', childId)
    .single();

  if (!child) return null;

  await logAuditEvent({
    userId: profile.id,
    action: 'READ_CNP',
    entityType: 'child',
    entityId: childId,
    metadata: { registration_id: child.registration_id },
  });

  return child.cnp;
}

export async function createRegistrationAction(rawValues: RegistrationFormValues) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canEditRegistrations(profile.role)) {
    return { error: 'Nu aveți permisiunea de a crea înregistrări.' };
  }

  const parsed = registrationSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { error: 'Datele introduse sunt invalide.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const values = parsed.data;
  const supabase = await createClient();

  const { data: reg, error: regError } = await supabase
    .from('registrations')
    .insert({
      source: values.source || 'manual',
      parent_first_name: values.parent_first_name,
      parent_last_name: values.parent_last_name,
      primary_email: values.primary_email,
      secondary_email: values.secondary_email || null,
      phone: values.phone,
      postal_address: values.postal_address || null,
      county: values.county,
      city: values.city,
      comments: values.comments || null,
      privacy_policy_accepted: values.privacy_policy_accepted,
      family_details: values.family_details || null,
      notification_email: values.notification_email || null,
      internal_notes: values.internal_notes || null,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select('id')
    .single();

  if (regError || !reg) {
    return { error: `Eroare la salvarea înregistrării: ${regError?.message}` };
  }

  // Insert children
  if (values.children && values.children.length > 0) {
    const childrenToInsert = values.children.map((child) => ({
      registration_id: reg.id,
      first_name: child.first_name,
      last_name: child.last_name,
      email: child.email || null,
      cnp: child.cnp,
      age: child.age || null,
      birth_date: child.birth_date || null,
    }));

    const { error: childrenError } = await supabase.from('children').insert(childrenToInsert);

    if (childrenError) {
      return { error: `Înregistrarea părinte a fost salvată, dar a apărut o eroare la salvarea copiilor: ${childrenError.message}` };
    }
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'CREATE_REGISTRATION',
    entityType: 'registration',
    entityId: reg.id,
    metadata: { parent_email: values.primary_email, children_count: values.children.length },
  });

  revalidatePath('/registrations');
  return { success: true, registrationId: reg.id };
}

export async function updateRegistrationAction(id: string, rawValues: RegistrationFormValues) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canEditRegistrations(profile.role)) {
    return { error: 'Nu aveți permisiunea de a modifica înregistrări.' };
  }

  const parsed = registrationSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { error: 'Datele introduse sunt invalide.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const values = parsed.data;
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      parent_first_name: values.parent_first_name,
      parent_last_name: values.parent_last_name,
      primary_email: values.primary_email,
      secondary_email: values.secondary_email || null,
      phone: values.phone,
      postal_address: values.postal_address || null,
      county: values.county,
      city: values.city,
      comments: values.comments || null,
      privacy_policy_accepted: values.privacy_policy_accepted,
      family_details: values.family_details || null,
      notification_email: values.notification_email || null,
      internal_notes: values.internal_notes || null,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq('id', id);

  if (updateError) {
    return { error: `Eroare la actualizarea înregistrării: ${updateError.message}` };
  }

  // Preserve existing child rows. Replacing every row required DELETE permission
  // even when the user only edited the parent, and RLS intentionally reserves
  // deletion for admins.
  const { data: existingChildren, error: existingChildrenError } = await supabase
    .from('children')
    .select('id')
    .eq('registration_id', id);

  if (existingChildrenError) {
    return { error: `Datele părintelui au fost actualizate, dar copiii nu au putut fi verificați: ${existingChildrenError.message}` };
  }

  const submittedIds = new Set(values.children.flatMap((child) => child.id ? [child.id] : []));
  const removedIds = (existingChildren || []).map((child) => child.id).filter((childId) => !submittedIds.has(childId));

  if (removedIds.length > 0) {
    const { data: deletedChildren, error: deleteChildrenError } = await supabase
      .from('children')
      .delete()
      .eq('registration_id', id)
      .in('id', removedIds)
      .select('id');

    if (deleteChildrenError || deletedChildren?.length !== removedIds.length) {
      return { error: 'Datele părintelui au fost actualizate, dar unul sau mai mulți copii nu au putut fi șterși. Verificați permisiunile contului.' };
    }
  }

  for (const child of values.children) {
    const childValues = {
      first_name: child.first_name,
      last_name: child.last_name,
      email: child.email || null,
      cnp: child.cnp,
      age: child.age || null,
      birth_date: child.birth_date || null,
    };

    const result = child.id
      ? await supabase.from('children').update(childValues).eq('id', child.id).eq('registration_id', id).select('id').maybeSingle()
      : await supabase.from('children').insert({ registration_id: id, ...childValues }).select('id').single();

    if (result.error || !result.data) {
      return { error: `Datele părintelui au fost actualizate, dar copilul ${child.first_name} ${child.last_name} nu a putut fi salvat: ${result.error?.message || 'operațiunea nu a fost permisă'}` };
    }
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'UPDATE_REGISTRATION',
    entityType: 'registration',
    entityId: id,
  });

  revalidatePath('/registrations');
  revalidatePath(`/registrations/${id}`);
  return { success: true };
}

export async function updateChildAction(
  registrationId: string,
  childId: string,
  rawValues: ChildDetailsValues
) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canEditRegistrations(profile.role)) {
    return { error: 'Nu aveți permisiunea de a modifica datele copilului.' };
  }

  const parsed = childDetailsSchema.safeParse(rawValues);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError || 'Datele copilului sunt invalide.' };
  }

  const values = parsed.data;
  const age = calculateCurrentAge(values.birth_date);
  const supabase = await createClient();
  const updateValues = {
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email || null,
    birth_date: values.birth_date || null,
    age,
    updated_at: new Date().toISOString(),
    ...(values.cnp ? { cnp: values.cnp } : {}),
  };

  const { data: updatedChild, error } = await supabase
    .from('children')
    .update(updateValues)
    .eq('id', childId)
    .eq('registration_id', registrationId)
    .select('id')
    .maybeSingle();

  if (error) {
    return { error: `Eroare la actualizarea copilului: ${error.message}` };
  }

  if (!updatedChild) {
    return { error: 'Copilul nu a fost găsit în familia selectată.' };
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'UPDATE_CHILD',
    entityType: 'child',
    entityId: childId,
    metadata: { registration_id: registrationId },
  });

  revalidatePath(`/registrations/${registrationId}`);
  revalidatePath('/registrations');
  return { success: true };
}

export async function deleteRegistrationAction(id: string) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canDeleteRegistrations(profile.role)) {
    return { error: 'Doar administratorii pot șterge înregistrări.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('registrations').delete().eq('id', id);

  if (error) {
    return { error: `Eroare la ștergerea înregistrării: ${error.message}` };
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'DELETE_REGISTRATION',
    entityType: 'registration',
    entityId: id,
  });

  revalidatePath('/registrations');
  return { success: true };
}

export async function deleteMultipleRegistrationsAction(ids: string[]) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canDeleteRegistrations(profile.role)) {
    return { error: 'Doar administratorii pot șterge înregistrări.' };
  }

  if (!ids || ids.length === 0) {
    return { error: 'Nu a fost selectată nicio înregistrare pentru ștergere.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('registrations').delete().in('id', ids);

  if (error) {
    return { error: `Eroare la ștergerea înregistrărilor: ${error.message}` };
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'DELETE_MULTIPLE_REGISTRATIONS',
    entityType: 'registration',
    entityId: ids.join(','),
    metadata: { deleted_count: ids.length, deleted_ids: ids },
  });

  revalidatePath('/registrations');
  return { success: true, count: ids.length };
}

export async function addChildAction(registrationId: string, values: {
  first_name: string;
  last_name: string;
  email?: string | null;
  cnp?: string | null;
  birth_date?: string | null;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canEditRegistrations(profile.role)) {
    return { error: 'Nu aveți permisiunea de a adăuga copii.' };
  }

  const supabase = await createClient();

  let birthDateStr: string | null = null;
  if (values.birth_date && values.birth_date.trim()) {
    const clean = values.birth_date.trim();
    if (/^\d{4}$/.test(clean)) {
      birthDateStr = `${clean}-01-01`;
    } else {
      birthDateStr = clean;
    }
  }

  let cnpStr = values.cnp?.trim() || '';
  if (!cnpStr) {
    cnpStr = `NO_CNP_${Date.now()}`;
  }

  const age = birthDateStr ? calculateCurrentAge(birthDateStr) : null;

  const { error: insertError } = await supabase.from('children').insert({
    registration_id: registrationId,
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email || null,
    cnp: cnpStr,
    age: age,
    birth_date: birthDateStr,
  });

  if (insertError) {
    return { error: `Eroare la adăugarea copilului: ${insertError.message}` };
  }

  revalidatePath(`/registrations/${registrationId}`);
  revalidatePath('/registrations');
  return { success: true };
}
