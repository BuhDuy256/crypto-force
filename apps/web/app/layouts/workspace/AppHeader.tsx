import { NavLink } from 'react-router';
import { Logo } from '~/components/Logo';
import { useSignOut } from '~/hooks/useAuth';
import { cn } from '~/utils/cn';
import { AccountMenu } from './AccountMenu';
import { MobileNav } from './MobileNav';
import { WORKSPACE_TABS } from './tabs';

interface AppHeaderProps {
  user: { name: string; email: string };
}

/**
 * App header of every workspace screen (workspace.md, App header). Search, Notifications, the
 * running-backtest chip and the Market data indicator arrive with the flows they lead to (roadmap.md).
 */
export function AppHeader({ user }: AppHeaderProps) {
  const signOut = useSignOut();
  const onSignOut = () => {
    signOut.mutate();
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-15 max-w-page items-center gap-x-7 px-4 sm:px-7 lg:gap-x-5 xl:gap-x-7">
        <Logo />
        <nav aria-label="Main" className="hidden self-stretch lg:flex">
          {WORKSPACE_TABS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center border-b-2 px-3 pt-0.5 text-[15px] whitespace-nowrap no-underline xl:px-4',
                  isActive
                    ? 'border-info font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
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
  );
}
