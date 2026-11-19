import { useState, type ComponentProps, type ReactNode } from 'react';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { cn } from '~/utils/cn';

interface AuthFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string | undefined;
  /** Shown under the field when there is no error. */
  hint?: string | undefined;
  /** Rendered at the end of the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode;
}

const inputClass = 'h-12 rounded-lg bg-muted px-4 text-base md:text-base dark:bg-muted';

function FieldMessage({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string | undefined;
  hint?: string | undefined;
}) {
  if (!error && !hint) return null;
  return (
    <span id={id} className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
      {error ?? hint}
    </span>
  );
}

function FieldLabelRow({ id, label, action }: { id: string; label: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <Label htmlFor={id} className="text-sm font-bold">
        {label}
      </Label>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

export function AuthField({
  id,
  label,
  error,
  hint,
  labelAction,
  className,
  ...props
}: AuthFieldProps) {
  const messageId = `${id}-msg`;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabelRow id={id} label={label} action={labelAction} />
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(inputClass, className)}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  labelAction,
  className,
  ...props
}: Omit<AuthFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  const messageId = `${id}-msg`;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabelRow id={id} label={label} action={labelAction} />
      <div className="flex">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(inputClass, 'rounded-r-none border-r-0', className)}
          {...props}
        />
        <button
          type="button"
          aria-pressed={visible}
          aria-label="Show password"
          onClick={() => {
            setVisible((value) => !value);
          }}
          className="min-w-16 rounded-r-lg border border-input bg-muted px-3 text-sm font-semibold hover:bg-accent dark:bg-muted dark:hover:bg-accent"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
