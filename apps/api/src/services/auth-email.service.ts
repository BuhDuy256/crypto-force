import type { EmailMessage, Mailer } from './mailer';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function buildMessage(
  to: string,
  subject: string,
  intro: string,
  action: { label: string; url: string } | null,
  outro: string,
): EmailMessage {
  const text = [intro, action ? `${action.label}: ${action.url}` : '', outro]
    .filter(Boolean)
    .join('\n\n');
  const button = action
    ? `<p><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#0B0E12;color:#E7ECF2;text-decoration:none;font-weight:600">${escapeHtml(action.label)}</a></p>`
    : '';
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#0B0E12"><p>${escapeHtml(intro)}</p>${button}<p style="color:#555">${escapeHtml(outro)}</p></div>`;
  return { to, subject, text, html };
}

export function createAuthEmails(mailer: Mailer, appUrl: string) {
  return {
    sendVerification(to: string, url: string) {
      return mailer.send(
        buildMessage(
          to,
          'Confirm your Crypto Force account',
          'Confirm your email address to activate your Crypto Force account.',
          { label: 'Confirm email', url },
          'The link expires in 1 hour. If you didn’t create an account, ignore this email.',
        ),
      );
    },

    sendPasswordReset(to: string, url: string) {
      return mailer.send(
        buildMessage(
          to,
          'Reset your Crypto Force password',
          'Someone asked to reset the password for your Crypto Force account.',
          { label: 'Choose a new password', url },
          'The link expires in 1 hour and works once. If you didn’t ask for this, ignore this email; your password stays the same.',
        ),
      );
    },

    /** Sent when someone tries to create an account with an email that already has one. */
    /** `emailVerified: false` adds how to confirm the email (authentication.md, Create account). */
    sendExistingAccount(to: string, emailVerified: boolean) {
      const resetUrl = new URL('/forgot-password', appUrl).toString();
      const outro = emailVerified
        ? `Forgot your password? Reset it at ${resetUrl}. If this wasn’t you, ignore this email.`
        : `This email is not confirmed yet. Reset your password at ${resetUrl}, then sign in and choose “Resend the link” to confirm your email. If this wasn’t you, ignore this email.`;
      return mailer.send(
        buildMessage(
          to,
          'You already have a Crypto Force account',
          'Someone tried to create a Crypto Force account with this email address, but it already has an account.',
          { label: 'Sign in', url: new URL('/sign-in', appUrl).toString() },
          outro,
        ),
      );
    },
  };
}

export type AuthEmails = ReturnType<typeof createAuthEmails>;
