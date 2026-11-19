import { z } from 'zod';

/** Minimum password length, enforced by the auth server and by every auth form. */
export const PASSWORD_MIN_LENGTH = 8;
/** Maximum password length, enforced by the auth server and by every auth form. */
export const PASSWORD_MAX_LENGTH = 128;

/** Length in Unicode code points, the unit of every length rule (authentication.md). */
export const codePointLength = (value: string) => Array.from(value).length;

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .pipe(z.email('That doesn’t look like an email address. Check for a missing @ or domain.'));

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean(),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Enter your full name.'),
  email: emailSchema,
  password: newPasswordSchema,
  acceptTerms: z.boolean().refine((accepted) => accepted, 'Please confirm to create your account.'),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Fill in both fields.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'The two passwords don’t match.',
    path: ['confirmPassword'],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Public auth configuration the web app needs before rendering the auth screens. */
export const authConfigSchema = z.object({ google: z.boolean() });
export type AuthConfig = z.infer<typeof authConfigSchema>;
