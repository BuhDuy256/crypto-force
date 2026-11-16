import type { Logger } from 'pino';
import { Resend } from 'resend';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}

interface MailerConfig {
  nodeEnv: 'development' | 'test' | 'production';
  resendApiKey: string | undefined;
  from: string | undefined;
}

/**
 * Sends email through Resend. Without a Resend key outside production, prints the
 * message to the console instead, so auth links stay usable locally. The console
 * output contains one-time tokens, so it bypasses the structured logger on purpose
 * (docs/architecture/23-security.md).
 */
export function createMailer(config: MailerConfig, logger: Logger): Mailer {
  const { resendApiKey, from } = config;

  if (resendApiKey && from) {
    const resend = new Resend(resendApiKey);
    return {
      async send(message) {
        const { error } = await resend.emails.send({ from, ...message });
        if (error) {
          logger.error({ err: error, subject: message.subject }, 'Failed to send email');
          throw new Error(`Resend rejected the email: ${error.message}`);
        }
      },
    };
  }

  if (config.nodeEnv === 'production') {
    throw new Error('RESEND_API_KEY and EMAIL_FROM are required in production.');
  }

  logger.warn('RESEND_API_KEY is not set; emails are printed to the console.');
  return {
    send(message) {
      console.info(
        `\n--- Email (not sent) ---\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n------------------------\n`,
      );
      return Promise.resolve();
    },
  };
}
