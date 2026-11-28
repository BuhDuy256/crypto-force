import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Logo } from '~/components/Logo';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { useSignOut } from '~/hooks/useAuth';
import { useActiveBacktest } from '~/hooks/useBacktests';
import { useBacktestFinishNotice } from '~/hooks/useBacktestFinishNotice';
import { cn } from '~/utils/cn';
import { AccountMenu } from './AccountMenu';
import { MobileNav } from './MobileNav';
import { WORKSPACE_TABS } from './tabs';

interface AppHeaderProps {
  user: { name: string; email: string };
}

const tabClass =
  'flex items-center border-b-2 px-3 pt-0.5 text-[15px] whitespace-nowrap no-underline xl:px-4';

function isTabActive(to: string, pathname: string): boolean {
  if (to === '/strategy') return pathname === '/strategy' || pathname === '/library';
  return pathname === to;
}

/**
 * App header of every workspace screen (docs/design/prototype/docs/requirements/workspace.md, App header). Search, Notifications,
 * and the Market data indicator arrive with the flows they lead to.
 */
export function AppHeader({ user }: AppHeaderProps) {
  const { pathname } = useLocation();
  const signOut = useSignOut();
  const activeQuery = useActiveBacktest();
  const activeRun = activeQuery.data?.run ?? null;
  const runningRun = activeRun?.status === 'running' ? activeRun : null;
  useBacktestFinishNotice(activeRun);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  const onSignOut = () => {
    if (runningRun === null) {
      signOut.mutate();
      return;
    }
    setSignOutDialogOpen(true);
  };

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex min-h-15 max-w-page items-center gap-x-7 px-4 sm:px-7 lg:gap-x-5 xl:gap-x-7">
          <Logo />
          <nav aria-label="Main" className="hidden self-stretch lg:flex">
            {WORKSPACE_TABS.map(({ to, label }) => {
              const active = isTabActive(to, pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    tabClass,
                    active
                      ? 'border-info font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {runningRun !== null ? (
              <Link
                to={`/backtest?run=${encodeURIComponent(runningRun.id)}`}
                aria-label={`Open running backtest ${runningRun.id}, ${runningRun.progressPercent}%`}
                className="inline-flex min-h-9 items-center rounded-full border border-info/40 bg-info/10 px-3 text-xs font-semibold whitespace-nowrap text-info no-underline hover:bg-info/15"
              >
                Backtest {runningRun.progressPercent}%
              </Link>
            ) : null}
            <div className="hidden lg:block">
              <AccountMenu name={user.name} email={user.email} onSignOut={onSignOut} />
            </div>
            <MobileNav
              name={user.name}
              email={user.email}
              signingOut={signOut.isPending}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      </header>

      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A backtest is still running</DialogTitle>
            <DialogDescription>
              Signing out does not stop the running backtest. Results will appear in Runs when you
              sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSignOutDialogOpen(false);
              }}
            >
              Stay signed in
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setSignOutDialogOpen(false);
                signOut.mutate();
              }}
            >
              Sign out anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
