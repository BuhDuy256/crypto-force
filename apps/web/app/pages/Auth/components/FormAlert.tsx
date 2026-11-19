import type { ReactNode } from 'react';
import { cn } from '~/utils/cn';

const tones = {
  error: 'border-destructive/50 bg-destructive/10 text-foreground',
  success: 'border-success/60 bg-success/10 text-foreground',
  info: 'border-info/50 bg-info/10 text-foreground',
};

interface FormAlertProps {
  tone: keyof typeof tones;
  /** `alert` interrupts screen readers; use `status` for confirmations and notes. */
  role: 'alert' | 'status';
  children: ReactNode;
  className?: string;
}

export function FormAlert({ tone, role, children, className }: FormAlertProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm leading-normal',
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Inline action inside an alert or a sentence, styled as a link. */
export function TextButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'self-start rounded-sm p-0 text-sm font-semibold text-info underline underline-offset-3 disabled:text-muted-foreground disabled:no-underline',
        className,
      )}
    >
      {children}
    </button>
  );
}
