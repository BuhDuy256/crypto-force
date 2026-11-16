import { destinationLabel, getSafeNext } from '~/utils/auth-redirect';
import { FormAlert } from './FormAlert';

/** Tells the user where they will land, when Auth was opened from a pending action. */
export function NextNote({ next }: { next: string | null }) {
  if (!next) return null;
  const label = destinationLabel(getSafeNext(next));
  return (
    <FormAlert tone="info" role="status">
      Sign in to continue to {label}. We’ll take you back to where you were.
    </FormAlert>
  );
}

export function AuthHeading({ children }: { children: string }) {
  return (
    <h1
      id="auth-title"
      className="m-0 text-[clamp(26px,7vw,32px)] leading-[1.1] font-semibold tracking-[-0.03em]"
    >
      {children}
    </h1>
  );
}
