import { MenuIcon, XIcon } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { Logo } from '~/components/Logo';
import { Button } from '~/components/ui/button';
import { useIsSignedIn } from '~/hooks/useAuth';
import { sectionLinks, WORKSPACE_HOME } from '../sections';

/** Signed-in visitors get Open workspace in place of Sign in and Create account (public-pages.md). */
export function LandingHeader() {
  const signedIn = useIsSignedIn();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleDrawerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return;
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <header className="relative z-20 border-b bg-background">
      <div className="mx-auto flex max-w-page items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-7">
        <Logo />
        <nav aria-label="Page" className="hidden gap-6 text-[15px] lg:flex">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 text-secondary-foreground/80 no-underline hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button asChild className="h-11 px-5 text-[15px] font-semibold no-underline">
              <Link to={WORKSPACE_HOME}>Open workspace</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden h-11 px-4 text-[15px] font-semibold text-foreground no-underline lg:flex"
              >
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="h-11 px-5 text-[15px] font-semibold no-underline">
                <Link to="/sign-up">Create account</Link>
              </Button>
            </>
          )}
          <Button
            ref={menuButtonRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-11 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-drawer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav
          id="landing-drawer"
          aria-label="Page"
          onKeyDown={handleDrawerKeyDown}
          className="flex flex-col border-t px-5 pt-2 pb-5 lg:hidden"
        >
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="flex min-h-12 items-center border-b text-base text-foreground no-underline hover:bg-accent"
            >
              {link.label}
            </a>
          ))}
          {!signedIn && (
            <Button
              asChild
              variant="outline"
              className="mt-4 h-12 text-base font-semibold text-foreground no-underline"
            >
              <Link to="/sign-in">Sign in</Link>
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
