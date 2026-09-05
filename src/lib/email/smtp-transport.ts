import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || process.env.NEXT_PUBLIC_SMTP_HOST || 'smtp.zoho.eu';
  const portStr = process.env.SMTP_PORT || process.env.NEXT_PUBLIC_SMTP_PORT || '465';
  const port = parseInt(portStr, 10) || 465;
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.NEXT_PUBLIC_SMTP_USER || 'brasov@asfanu.ro';
  const pass = process.env.SMTP_PASS || process.env.NEXT_PUBLIC_SMTP_PASS || '';
  const from = process.env.SMTP_FROM || `Asociația ASFANU Brașov <${user}>`;

  return { host, port, secure, user, pass, from };
}

export function createSmtpTransport() {
  const config = getSmtpConfig();
  if (!config.pass) {
    throw new Error('Parola SMTP nu este configurată (SMTP_PASS). Verificați fișierul .env.local');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed SSL handshake failures
    },
  });
}
