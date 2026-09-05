import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { generateCouponCode, parseCouponCode } from '@/lib/utils/coupon-code';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
type SubscriptionRow = Database['public']['Tables']['campaign_subscriptions']['Row'];

export interface CampaignWithStats extends CampaignRow {
  subscription_count: number;
  emails_sent_count?: number;
  missing_email_count?: number;
}

export interface CampaignForRegistration extends CampaignRow {
  is_subscribed: boolean;
  coupon_code: string | null;
  coupon_number: number | null;
  subscribed_at: string | null;
}

export interface CampaignFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function resolveFamilyNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  registrationId: string
): Promise<number> {
  const { data: targetReg } = await supabase
    .from('registrations')
    .select('family_number, registered_at')
    .eq('id', registrationId)
    .single();

  const regNum = (targetReg as unknown as { family_number?: number })?.family_number;
  if (regNum && regNum > 0) {
    return regNum;
  }

  const { data: allRegs } = await supabase
    .from('registrations')
    .select('id')
    .order('registered_at', { ascending: true });

  if (allRegs && allRegs.length > 0) {
    const idx = allRegs.findIndex((r) => r.id === registrationId);
    if (idx !== -1) {
      return idx + 1;
    }
  }

  return 1;
}

export async function getCampaigns(filters: CampaignFilters = {}) {
  const supabase = await createClient();
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('campaigns')
    .select('*', { count: 'exact' });

  if (filters.search) {
    const searchClean = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${searchClean},description.ilike.${searchClean}`);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Eroare la preluarea campaniilor: ${error.message}`);
  }

  const campaigns = (data as CampaignRow[]) || [];

  // Fetch subscription counts for each campaign
  const campaignIds = campaigns.map((c) => c.id);
  let subscriptionCounts: Record<string, number> = {};

  if (campaignIds.length > 0) {
    const { data: subsData } = await supabase
      .from('campaign_subscriptions')
      .select('campaign_id')
      .in('campaign_id', campaignIds);

    if (subsData) {
      subscriptionCounts = subsData.reduce((acc: Record<string, number>, sub) => {
        acc[sub.campaign_id] = (acc[sub.campaign_id] || 0) + 1;
        return acc;
      }, {});
    }
  }

  const campaignsWithStats: CampaignWithStats[] = campaigns.map((c) => ({
    ...c,
    subscription_count: subscriptionCounts[c.id] || 0,
  }));

  return {
    campaigns: campaignsWithStats,
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getCampaignById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('Campania nu a fost găsită.');
  }

  // Subscriptions email stats
  let { data: subsData, error: subsDataError } = await supabase
    .from('campaign_subscriptions')
    .select('id, email_sent_at, registrations!inner(primary_email)')
    .eq('campaign_id', id);

  if (subsDataError && subsDataError.message.includes('email_sent_at')) {
    const fallbackSubs = await supabase
      .from('campaign_subscriptions')
      .select('id, registrations!inner(primary_email)')
      .eq('campaign_id', id);
    subsData = (fallbackSubs.data || []).map((s) => ({ ...s, email_sent_at: null }));
  }

  const totalSubs = subsData?.length || 0;
  let emailsSent = 0;
  let missingEmail = 0;

  if (subsData && subsData.length > 0) {
    (subsData as unknown as Array<{ id: string; email_sent_at: string | null; registrations: { primary_email: string | null } | null }>).forEach((s) => {
      if (s.email_sent_at) emailsSent++;
      const email = s.registrations?.primary_email;
      if (!email || !email.trim()) missingEmail++;
    });
  }

  return {
    ...(data as CampaignRow),
    subscription_count: totalSubs,
    emails_sent_count: emailsSent,
    missing_email_count: missingEmail,
  } as CampaignWithStats;
}

export async function getCampaignSubscriptions(campaignId: string) {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from('campaign_subscriptions')
    .select(`
      id,
      campaign_id,
      registration_id,
      coupon_number,
      coupon_code,
      subscribed_at,
      subscribed_by,
      email_sent_at,
      email_sent_to,
      registrations!inner (
        id,
        parent_first_name,
        parent_last_name,
        primary_email,
        phone,
        county,
        city,
        family_number
      )
    `)
    .eq('campaign_id', campaignId)
    .order('subscribed_at', { ascending: false });

  if (error && error.message.includes('email_sent_at')) {
    const fallbackRes = await supabase
      .from('campaign_subscriptions')
      .select(`
        id,
        campaign_id,
        registration_id,
        coupon_number,
        coupon_code,
        subscribed_at,
        subscribed_by,
        registrations!inner (
          id,
          parent_first_name,
          parent_last_name,
          primary_email,
          phone,
          county,
          city,
          family_number
        )
      `)
      .eq('campaign_id', campaignId)
      .order('subscribed_at', { ascending: false });

    data = fallbackRes.data as typeof data;
    error = fallbackRes.error;
  }

  if (error) {
    throw new Error(`Eroare la preluarea înscrierilor: ${error.message}`);
  }

  const subscriptions = data || [];

  // Self-heal any existing subscriptions with mismatched family numbers
  if (subscriptions.length > 0) {
    for (const sub of subscriptions) {
      if (sub.coupon_code) {
        const parsed = parseCouponCode(sub.coupon_code);
        const reg = sub.registrations as unknown as { id: string; family_number?: number };
        let expectedFamNum = reg?.family_number || 0;
        if (!expectedFamNum && reg?.id) {
          expectedFamNum = await resolveFamilyNumber(supabase, reg.id);
        }

        if (expectedFamNum > 0 && parsed.familyNumber !== expectedFamNum) {
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('code_slug')
            .eq('id', campaignId)
            .single();

          const correctCode = generateCouponCode({
            slug: campaign?.code_slug || parsed.slug || 'ASF',
            date: sub.subscribed_at ? new Date(sub.subscribed_at) : (parsed.formattedDate ? new Date(parsed.formattedDate) : new Date()),
            familyNumber: expectedFamNum,
          });

          await supabase
            .from('campaign_subscriptions')
            .update({ coupon_code: correctCode })
            .eq('id', sub.id);

          sub.coupon_code = correctCode;
        }
      }
    }
  }

  return subscriptions;
}

export async function getCampaignsForRegistration(registrationId: string): Promise<CampaignForRegistration[]> {
  const supabase = await createClient();

  // Get all active campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*')
    .in('status', ['active', 'draft'])
    .order('created_at', { ascending: false });

  if (campaignsError) {
    throw new Error(`Eroare la preluarea campaniilor: ${campaignsError.message}`);
  }

  // Get subscriptions for this registration
  const { data: subscriptions, error: subsError } = await supabase
    .from('campaign_subscriptions')
    .select('id, campaign_id, coupon_code, coupon_number, subscribed_at')
    .eq('registration_id', registrationId);

  if (subsError) {
    throw new Error(`Eroare la preluarea înscrierilor: ${subsError.message}`);
  }

  const expectedFamNum = await resolveFamilyNumber(supabase, registrationId);

  const subsMap = new Map();

  if (subscriptions && subscriptions.length > 0) {
    for (const sub of subscriptions) {
      if (sub.coupon_code) {
        const parsed = parseCouponCode(sub.coupon_code);
        if (expectedFamNum > 0 && parsed.familyNumber !== expectedFamNum) {
          const campaign = campaigns?.find((c) => c.id === sub.campaign_id);
          const correctCode = generateCouponCode({
            slug: campaign?.code_slug || parsed.slug || 'ASF',
            date: sub.subscribed_at ? new Date(sub.subscribed_at) : (parsed.formattedDate ? new Date(parsed.formattedDate) : new Date()),
            familyNumber: expectedFamNum,
          });

          await supabase
            .from('campaign_subscriptions')
            .update({ coupon_code: correctCode })
            .eq('id', sub.id);

          sub.coupon_code = correctCode;
        }
      }
      subsMap.set(sub.campaign_id, sub);
    }
  }

  return (campaigns || []).map((campaign) => {
    const sub = subsMap.get(campaign.id);
    return {
      ...campaign,
      is_subscribed: !!sub,
      coupon_code: sub?.coupon_code || null,
      coupon_number: sub?.coupon_number || null,
      subscribed_at: sub?.subscribed_at || null,
    };
  });
}

export async function subscribeFamilyToCampaign(
  campaignId: string,
  registrationId: string,
  subscribedBy: string
): Promise<SubscriptionRow> {
  const supabase = await createClient();

  // 1. Get campaign details
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('code_slug, campaign_number, status')
    .eq('id', campaignId)
    .single();

  if (!campaign || campaign.status !== 'active') {
    throw new Error('Înscrierile sunt permise doar în campanii cu status Active.');
  }

  // 2. Get target registration family number (uses family_number column or chronological rank)
  const familyNumber = await resolveFamilyNumber(supabase, registrationId);

  const generatedCode = generateCouponCode({
    slug: campaign?.code_slug || 'ASF',
    date: new Date(),
    familyNumber: familyNumber,
  });

  const { data, error } = await supabase
    .from('campaign_subscriptions')
    .insert({
      campaign_id: campaignId,
      registration_id: registrationId,
      subscribed_by: subscribedBy,
      coupon_code: generatedCode,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Această familie este deja înscrisă în campania selectată.');
    }
    throw new Error(`Eroare la înscrierea familiei: ${error.message}`);
  }

  // Ensure DB triggers didn't overwrite coupon_code with legacy ASFANU string format
  if (data && data.coupon_code !== generatedCode) {
    await supabase
      .from('campaign_subscriptions')
      .update({ coupon_code: generatedCode })
      .eq('id', data.id);
    data.coupon_code = generatedCode;
  }

  return data as SubscriptionRow;
}

export async function unsubscribeFamilyFromCampaign(
  campaignId: string,
  registrationId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('campaign_subscriptions')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('registration_id', registrationId);

  if (error) {
    throw new Error(`Eroare la dezabonarea familiei din campanie: ${error.message}`);
  }
}

