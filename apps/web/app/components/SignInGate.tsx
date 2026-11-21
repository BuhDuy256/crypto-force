import { LockKeyholeIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';

interface SignInGateProps {
  /** Name of the workspace screen the user tried to open. */
  screen: string;
  signInHref: string;
}

/** Replaces a workspace screen when there is no session (docs/UCs/authentication.md, SS-03). */
export function SignInGate({ screen, signInHref }: SignInGateProps) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex min-h-svh items-center justify-center bg-background px-4 py-6"
    >
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-xl border bg-card p-7">
        <LockKeyholeIcon className="size-9 text-info" aria-hidden="true" />
        <h1 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.02em]">
          Sign in to open {screen}
        </h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">
          Your workspace is only available while you’re signed in. After you sign in, we’ll bring
          you back to {screen}.
        </p>
        <Button asChild size="lg" className="min-h-12 text-base font-bold">
          <Link to={signInHref}>Sign in to continue</Link>
        </Button>
        <Button asChild variant="link" className="min-h-11 self-center font-semibold text-info">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
