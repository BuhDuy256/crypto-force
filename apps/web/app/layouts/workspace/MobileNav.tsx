import { LogOutIcon, MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { cn } from '~/utils/cn';
import { WORKSPACE_TABS } from './tabs';
import { UserAvatar } from './UserAvatar';

interface MobileNavProps {
  name: string;
  email: string;
  signingOut: boolean;
  onSignOut: () => void;
}

const drawerLink =
  'flex min-h-12 items-center rounded-lg px-3 text-base text-foreground no-underline hover:bg-accent';

function isTabActive(to: string, pathname: string): boolean {
  if (to === '/strategy') return pathname === '/strategy' || pathname === '/library';
  return pathname === to;
}

/** Drawer that holds the tabs and account actions below the `lg` breakpoint (docs/design/prototype/docs/requirements/workspace.md, App header). */
export function MobileNav({ name, email, signingOut, onSignOut }: MobileNavProps) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="size-11 lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} className="gap-0 p-4">
        <div className="flex items-center justify-between pb-2">
          <SheetTitle>Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-lg" className="size-11" aria-label="Close menu">
              <XIcon className="size-5" aria-hidden="true" />
            </Button>
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">Workspace tabs and account</SheetDescription>
        <nav aria-label="Main" className="flex flex-col">
          {WORKSPACE_TABS.map(({ to, label }) => {
            const active = isTabActive(to, pathname);
            return (
              <Link
                key={to}
                to={to}
                onClick={close}
                aria-current={active ? 'page' : undefined}
                className={cn(drawerLink, active && 'bg-secondary font-semibold')}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <hr className="my-2 border-border" />
        <div className="flex items-center gap-3 px-3 py-2">
          <UserAvatar name={name} />
          <span className="flex min-w-0 flex-col leading-tight">
            <strong className="truncate text-sm font-semibold">{name}</strong>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          </span>
        </div>
        <Link to="/#faq" onClick={close} className={drawerLink}>
          Help &amp; FAQ
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className={cn(drawerLink, 'w-full gap-3 text-left text-destructive disabled:opacity-60')}
        >
          <LogOutIcon className="size-4" aria-hidden="true" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </SheetContent>
    </Sheet>
  );
}
