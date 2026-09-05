'use server';

import { getCurrentUserProfile } from '@/services/auth.service';
import { sendVoucherEmail, testSmtpConnection, SendVoucherParams } from '@/services/email.service';
import { canManageCampaigns } from '@/lib/security/permissions';

export async function sendVoucherEmailAction(params: SendVoucherParams) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageCampaigns(profile.role)) {
    return { error: 'Nu aveți permisiunea de a trimite email-uri cu vouchere.' };
  }

  try {
    const result = await sendVoucherEmail(params);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'A apărut o eroare la trimiterea emailului.' };
  }
}

export async function testSmtpConnectionAction(targetEmail: string = 'gabi@bitvice.ro') {
  const profile = await getCurrentUserProfile();
  if (!profile || !canManageCampaigns(profile.role)) {
    return { error: 'Nu aveți permisiunea de a testa conexiunea SMTP.' };
  }

  try {
    const result = await testSmtpConnection(targetEmail);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Eroare la conectarea cu serverul SMTP.' };
  }
}
