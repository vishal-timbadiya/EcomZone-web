import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';

/**
 * Shared SMTP transport.
 *
 * Previously every send created a new transporter and logged the SMTP username
 * and whether the password was set. Credentials never appear in logs here, and
 * the connection pool is reused.
 */

let cachedTransporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
  });

  return cachedTransporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

/**
 * Send an email. Returns false rather than throwing when mail is unconfigured or
 * delivery fails, so a mail problem never fails the operation that triggered it.
 */
export async function sendMail(options: MailOptions): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn({ event: 'mail_skipped', reason: 'not_configured', subject: options.subject });
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"EcomZone" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    logger.info({ event: 'mail_sent', subject: options.subject });
    return true;
  } catch (error) {
    logger.error({
      event: 'mail_failed',
      subject: options.subject,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}
