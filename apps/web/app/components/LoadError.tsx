import { useRevalidator } from 'react-router';
import { Button } from '~/components/ui/button';

/** Shown when the session could not be checked (network or server error), so signing in would not help. */
export function LoadError() {
  const revalidator = useRevalidator();
  const retrying = revalidator.state === 'loading';

  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex min-h-svh items-center justify-center bg-background px-4 py-6"
    >
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-xl border bg-card p-7">
        <h1 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.02em]">
          Couldn’t load your workspace
        </h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">
          We couldn’t reach Crypto Force. Check your connection and try again.
        </p>
        <Button
          size="lg"
          className="min-h-12 text-base font-bold"
          disabled={retrying}
          onClick={() => void revalidator.revalidate()}
        >
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    </main>
  );
}
