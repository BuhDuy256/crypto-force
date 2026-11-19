function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');
  return letters.toUpperCase() || '?';
}

/** Initials of the signed-in user; decorative because the name is always shown or announced next to it. */
export function UserAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-bold text-background"
    >
      {initials(name)}
    </span>
  );
}
