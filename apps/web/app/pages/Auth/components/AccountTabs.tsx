import type { KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { authPath, tabSwitchFromState } from '~/utils/auth-redirect';
import { cn } from '~/utils/cn';

const tabs = [
  { mode: 'signin', label: 'Sign in', path: '/sign-in' },
  { mode: 'signup', label: 'Create account', path: '/sign-up' },
] as const;

export type AccountMode = (typeof tabs)[number]['mode'];

export const ACCOUNT_PANEL_ID = 'account-panel';
export const tabId = (mode: AccountMode) => `tab-${mode}`;

interface AccountTabsProps {
  active: AccountMode;
  next: string | null;
  /** Email typed so far; carried to the other tab so switching does not lose it. */
  email: string;
}

/** Sign in / Create account tabs. Each tab is its own route; arrow keys, Home and End switch. */
export function AccountTabs({ active, next, email }: AccountTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Each tab is a route, so the newly selected tab mounts fresh; it takes focus when the
  // switch came from the tab list.
  const focusSelected = tabSwitchFromState(location.state);

  const select = (mode: AccountMode) => {
    const tab = tabs.find((item) => item.mode === mode);
    if (!tab || mode === active) return;
    void navigate(authPath(tab.path, next), { replace: true, state: { email, focusTab: true } });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, AccountMode> = {
      Home: 'signin',
      End: 'signup',
      ArrowLeft: active === 'signin' ? 'signup' : 'signin',
      ArrowRight: active === 'signin' ? 'signup' : 'signin',
    };
    const target = keys[event.key];
    if (!target) return;
    event.preventDefault();
    select(target);
  };

  return (
    <div role="tablist" aria-label="Account" onKeyDown={onKeyDown} className="flex border-b">
      {tabs.map((tab) => {
        const selected = tab.mode === active;
        return (
          <button
            key={tab.mode}
            id={tabId(tab.mode)}
            ref={selected && focusSelected ? (element) => element?.focus() : undefined}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ACCOUNT_PANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              select(tab.mode);
            }}
            className={cn(
              '-mb-px min-h-11.5 border-b-2 px-5 text-[15px]',
              selected
                ? 'border-info font-bold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
