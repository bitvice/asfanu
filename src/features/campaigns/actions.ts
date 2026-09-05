'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/auth.service';
import {
  getCampaigns,
  getCampaignById,
  getCampaignSubscriptions,
  getCampaignsForRegistration,
  subscribeFamilyToCampaign,
  unsubscribeFamilyFromCampaign,
  CampaignFilters,
} from '@/services/campaign.service';
import { canManageCampaigns, canSubscribeFamilies } from '@/lib/security/permissions';
import { campaignSchema, CampaignFormValues } from '@/lib/validation/campaign.schema';
import { logAuditEvent } from '@/lib/security/audit';
import { revalidatePath } from 'next/cache';

export async function fetchCampaignsAction(filters: CampaignFilters) {
  return await getCampaigns(filters);
}

export async function fetchCampaignByIdAction(id: string) {
  return await getCampaignById(id);
}

export async function fetchCampaignSubscriptionsAction(campaignId: string) {
  return await getCampaignSubscriptions(campaignId);
}

export async function fetchCampaignsForRegistrationAction(registrationId: string) {
  return await getCampaignsForRegistration(registrationId);
}

export async function createCampaignAction(rawValues: CampaignFormValues) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageCampaigns(profile.role)) {
    return { error: 'Nu aveți permisiunea de a crea campanii.' };
  }

  const parsed = campaignSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { error: 'Datele introduse sunt invalide.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const values = parsed.data;
  const supabase = await createClient();

  const { data: campaign, error: createError } = await supabase
    .from('campaigns')
    .insert({
      name: values.name,
      slug: values.slug,
      code_slug: values.code_slug,
      discount_percentage: values.discount_percentage,
      description: values.description || null,
      status: values.status,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (createError || !campaign) {
    if (createError?.code === '23505') {
      return { error: 'Există deja o campanie cu acest slug sau cod de 3 caractere. Alegeți un alt identificator.' };
    }
    return { error: `Eroare la crearea campaniei: ${createError?.message}` };
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'CREATE_CAMPAIGN',
    entityType: 'campaign',
    entityId: campaign.id,
    metadata: { campaign_name: values.name, discount: values.discount_percentage },
  });

  revalidatePath('/campaigns');
  return { success: true, campaignId: campaign.id };
}

export async function updateCampaignAction(id: string, rawValues: CampaignFormValues) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageCampaigns(profile.role)) {
    return { error: 'Nu aveți permisiunea de a modifica campanii.' };
  }

  const parsed = campaignSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { error: 'Datele introduse sunt invalide.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const values = parsed.data;
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      name: values.name,
      slug: values.slug,
      code_slug: values.code_slug,
      discount_percentage: values.discount_percentage,
      description: values.description || null,
      status: values.status,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    if (updateError.code === '23505') {
      return { error: 'Există deja o campanie cu acest slug.' };
    }
    return { error: `Eroare la actualizarea campaniei: ${updateError.message}` };
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'UPDATE_CAMPAIGN',
    entityType: 'campaign',
    entityId: id,
    metadata: { campaign_name: values.name },
  });

  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${id}`);
  return { success: true };
}

export async function updateCampaignTemplateAction(
  id: string,
  templateConfig: Record<string, unknown>
) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageCampaigns(profile.role)) {
    return { error: 'Nu aveți permisiunea de a modifica campanii.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('campaigns')
    .update({
      card_template_config: templateConfig,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { error: `Eroare la salvarea template-ului: ${error.message}` };
  }

  await logAuditEvent({
    userId: profile.id,
    action: 'UPDATE_CAMPAIGN',
    entityType: 'campaign',
    entityId: id,
    metadata: { action_detail: 'template_update' },
  });

  revalidatePath(`/campaigns/${id}`);
  return { success: true };
}

export async function subscribeFamilyAction(campaignId: string, registrationId: string) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canSubscribeFamilies(profile.role)) {
    return { error: 'Nu aveți permisiunea de a înscrie familii în campanii.' };
  }

  try {
    const subscription = await subscribeFamilyToCampaign(campaignId, registrationId, profile.id);

    await logAuditEvent({
      userId: profile.id,
      action: 'SUBSCRIBE_FAMILY',
      entityType: 'campaign',
      entityId: campaignId,
      metadata: {
        registration_id: registrationId,
        coupon_code: subscription.coupon_code,
        coupon_number: subscription.coupon_number,
      },
    });

    revalidatePath(`/registrations/${registrationId}`);
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, couponCode: subscription.coupon_code };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Eroare la înscrierea familiei.' };
  }
}

export async function unsubscribeFamilyAction(campaignId: string, registrationId: string) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canSubscribeFamilies(profile.role)) {
    return { error: 'Nu aveți permisiunea de a modifica înscrierile în campanii.' };
  }

  try {
    await unsubscribeFamilyFromCampaign(campaignId, registrationId);

    await logAuditEvent({
      userId: profile.id,
      action: 'UNSUBSCRIBE_FAMILY',
      entityType: 'campaign',
      entityId: campaignId,
      metadata: { registration_id: registrationId },
    });

    revalidatePath(`/registrations/${registrationId}`);
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Eroare la dezabonarea familiei.' };
  }
}

