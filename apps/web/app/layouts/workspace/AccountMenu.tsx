import { ChevronDownIcon, CircleHelpIcon, LogOutIcon } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { UserAvatar } from './UserAvatar';

interface AccountMenuProps {
  name: string;
  email: string;
  onSignOut: () => void;
}

/** Account menu of the App header (workspace.md, App header). */
export function AccountMenu({ name, email, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  // Radix keeps Tab inside an open menu; the APG menu pattern closes the menu on Tab instead.
  const closeOnTab = (event: KeyboardEvent) => {
    if (event.key === 'Tab') setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex min-h-11 items-center gap-3 rounded-lg py-0 pr-2 pl-1 text-left text-foreground hover:bg-accent data-[state=open]:bg-accent">
        <UserAvatar name={name} />
        {/* Capped at the menu width, where the full name and email stay readable. */}
        <span className="flex max-w-60 min-w-0 flex-col leading-tight max-xl:sr-only">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </span>
        <ChevronDownIcon className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-2" onKeyDown={closeOnTab}>
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-10">
          <Link to="/#faq" className="text-foreground no-underline">
            <CircleHelpIcon aria-hidden="true" />
            Help &amp; FAQ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="min-h-10" onSelect={onSignOut}>
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
