import { Link } from 'react-router';
import { Logo } from '~/components/Logo';
import { Button } from '~/components/ui/button';
import type { Route } from './+types/not-found';

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'Page not found – Crypto Force' },
    // The static host answers unknown paths with HTTP 200, so keep this page out of search results.
    { name: 'robots', content: 'noindex' },
  ];
}

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-page items-center gap-6 px-4 py-3 sm:px-7">
          <Logo />
          <Link
            to="/"
            className="ml-auto flex min-h-11 items-center rounded-md px-2 font-semibold text-foreground no-underline hover:bg-accent"
          >
            Home
          </Link>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-page flex-1 flex-col justify-center px-4 py-10 sm:px-7 lg:py-20"
      >
        <div className="flex max-w-[640px] flex-col gap-5">
          <span className="font-semibold text-info">Error 404</span>
          <h1 className="text-[clamp(26px,5vw,56px)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
            This page doesn’t exist.
          </h1>
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
            The link may be old or mistyped. Your strategies and results are still where you left
            them.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-5 text-[15px] font-semibold no-underline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
