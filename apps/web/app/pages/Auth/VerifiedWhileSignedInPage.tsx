import { Link } from 'react-router';
import { destinationLabel } from '~/utils/auth-redirect';
import { FormAlert } from './components/FormAlert';
import { AuthHeading } from './components/NextNote';

interface VerifiedWhileSignedInPageProps {
  verifiedEmail: string;
  currentEmail: string;
  next: string;
}

/** A verification link of another account was opened in a browser that keeps its session. */
export function VerifiedWhileSignedInPage({
  verifiedEmail,
  currentEmail,
  next,
}: VerifiedWhileSignedInPageProps) {
  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-4">
      <AuthHeading>Email verified</AuthHeading>
      <FormAlert tone="success" role="status">
        {`${verifiedEmail} is verified. You’re still signed in as ${currentEmail}.`}
      </FormAlert>
      <Link
        to={next}
        className="flex h-12.5 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground no-underline hover:bg-primary/90"
      >
        {`Continue to ${destinationLabel(next)}`}
      </Link>
    </section>
  );
}
