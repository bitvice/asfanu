import { createClient } from '@/lib/supabase/server';
import { createSmtpTransport, getSmtpConfig } from '@/lib/email/smtp-transport';
import { logAuditEvent } from '@/lib/security/audit';

export interface SendVoucherParams {
  subscriptionId: string;
  pdfBase64: string; // base64 encoded PDF string
  customNote?: string;
}

export async function sendVoucherEmail({ subscriptionId, pdfBase64, customNote }: SendVoucherParams) {
  const supabase = await createClient();

  // 1. Fetch subscription with registration and campaign details
  const { data: sub, error: subError } = await supabase
    .from('campaign_subscriptions')
    .select(`
      id,
      campaign_id,
      registration_id,
      coupon_code,
      subscribed_at,
      campaigns (
        id,
        name,
        discount_percentage,
        description,
        start_date,
        end_date
      ),
      registrations (
        id,
        parent_first_name,
        parent_last_name,
        primary_email,
        phone,
        family_number
      )
    `)
    .eq('id', subscriptionId)
    .single();

  if (subError || !sub) {
    throw new Error(`Înscrierea în campanie nu a fost găsită. (${subError?.message || 'ID invalid'})`);
  }

  type RegType = { id: string; parent_first_name: string; parent_last_name: string; primary_email: string | null };
  const rawReg = sub.registrations as unknown as (RegType | RegType[]);
  const reg = Array.isArray(rawReg) ? rawReg[0] : rawReg;

  const rawCamp = sub.campaigns as unknown as ({ id: string; name: string; discount_percentage: number; description: string | null; start_date: string | null; end_date: string | null } | { id: string; name: string; discount_percentage: number; description: string | null; start_date: string | null; end_date: string | null }[]);
  const campaign = Array.isArray(rawCamp) ? rawCamp[0] : rawCamp;

  if (!reg || !reg.primary_email || !reg.primary_email.trim()) {
    throw new Error('Familia nu are o adresă de email definită în sistem.');
  }

  if (!campaign) {
    throw new Error('Campania asociată nu a fost găsită.');
  }

  const familyName = `${reg.parent_last_name} ${reg.parent_first_name}`;
  const targetEmail = reg.primary_email.trim();
  const smtpConfig = getSmtpConfig();
  const transport = createSmtpTransport();

  // Clean base64 string if data URL prefix or filename parameter exists
  const base64Content = pdfBase64.includes(';base64,')
    ? pdfBase64.split(';base64,').pop() || ''
    : pdfBase64.replace(/^data:[^;]+;base64,/, '');
  const cleanBase64 = base64Content.replace(/\s+/g, '');
  const pdfBuffer = Buffer.from(cleanBase64, 'base64');

  // Verify valid PDF magic header (%PDF)
  const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
  if (!pdfHeader.startsWith('%PDF')) {
    throw new Error('Fișierul PDF generat este corupt. Vă rugăm să reîncercați trimiterea.');
  }

  const filename = `Voucher_${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_${reg.parent_last_name}_${sub.coupon_code}.pdf`;

  // 2. Build HTML email message
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px; }
        .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #334155; }
        .badge { display: inline-block; background-color: #e0e7ff; color: #3730a3; font-weight: 700; font-family: monospace; font-size: 16px; padding: 8px 16px; border-radius: 6px; margin: 12px 0; border: 1px solid #c7d2fe; }
        .box { background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 14px; margin: 16px 0; border-radius: 0 8px 8px 0; font-size: 13px; }
        .footer { background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Asociația ASFANU Brașov</h1>
          <p>Voucher de Reducere - ${campaign.name}</p>
        </div>
        <div class="content">
          <p>Stimată Familie <strong>${familyName}</strong>,</p>
          <p>Vă mulțumim pentru înscrierea în campania <strong>${campaign.name}</strong>! Vă trimitem atașat voucherul dumneavoastră oficial de reducere de <strong>${campaign.discount_percentage}%</strong>.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600;">Codul dumneavoastră de reducere:</div>
            <div class="badge">${sub.coupon_code}</div>
          </div>

          ${customNote ? `<div class="box"><strong>Notă informativă:</strong> ${customNote}</div>` : ''}

          <p>Voucherul în format PDF se află în atașamentul acestui email. Îl puteți prezenta în format electronic sau tipărit partenerilor noștri pentru a beneficia de reducere.</p>
          
          <p style="margin-top: 24px; font-size: 13px; color: #475569;">
            Cu deosebită considerație,<br>
            <strong>Echipa ASFANU Brașov</strong><br>
            <em>Împreună construim o comunitate mai puternică!</em>
          </p>
        </div>
        <div class="footer">
          Asociația ASFANU • Brașov • email: brasov@asfanu.ro<br>
          Acest email a fost transmis automat. Vă rugăm să nu răspundeți direct la acest mesaj.
        </div>
      </div>
    </body>
    </html>
  `;

  // 3. Send email using Nodemailer
  const sentInfo = await transport.sendMail({
    from: smtpConfig.from,
    to: targetEmail,
    subject: `[ASFANU] Voucherul dvs. de reducere - ${campaign.name}`,
    html: htmlContent,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  // 4. Update campaign_subscriptions record in DB with email_sent_at timestamp (safely)
  const nowIso = new Date().toISOString();
  try {
    await supabase
      .from('campaign_subscriptions')
      .update({
        email_sent_at: nowIso,
        email_sent_to: targetEmail,
      })
      .eq('id', subscriptionId);
  } catch {
    // Ignore if columns do not exist on DB schema yet
  }

  // 5. Log audit event
  await logAuditEvent({
    action: 'SEND_VOUCHER_EMAIL',
    entityType: 'campaign_subscription',
    entityId: subscriptionId,
    metadata: {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      registration_id: reg.id,
      target_email: targetEmail,
      message_id: sentInfo.messageId,
    },
  });

  return {
    success: true,
    emailSentAt: nowIso,
    sentTo: targetEmail,
    messageId: sentInfo.messageId,
  };
}

export async function testSmtpConnection(targetEmail: string = 'gabi@bitvice.ro') {
  const smtpConfig = getSmtpConfig();
  const transport = createSmtpTransport();

  // 1. Verify SMTP Connection & Auth
  await transport.verify();

  // 2. Send test email
  const info = await transport.sendMail({
    from: smtpConfig.from,
    to: targetEmail,
    subject: '[ASFANU Test] Verificare Conexiune SMTP ZoHO',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Verificare Conexiune SMTP ASFANU</h2>
        <p>Acesta este un email de test expediat prin serverul SMTP <strong>${smtpConfig.host}:${smtpConfig.port}</strong>.</p>
        <p><strong>Expeditor:</strong> ${smtpConfig.from}</p>
        <p><strong>Destinatar:</strong> ${targetEmail}</p>
        <p style="color: #16a34a; font-weight: bold;">✔ Conexiunea și autentificarea SMTP funcționează corect!</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 11px; color: #64748b;">Generat automat la ${new Date().toLocaleString('ro-RO')}</p>
      </div>
    `,
  });

  await logAuditEvent({
    action: 'TEST_SMTP_CONNECTION',
    entityType: 'smtp_settings',
    metadata: {
      target_email: targetEmail,
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.user,
      message_id: info.messageId,
    },
  });

  return {
    success: true,
    message: `Emailul de test a fost trimis cu succes către ${targetEmail}! (MessageId: ${info.messageId})`,
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.user,
  };
}
