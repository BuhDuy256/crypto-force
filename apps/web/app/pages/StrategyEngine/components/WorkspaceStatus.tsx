/** Short state label next to a Strategy Engine card heading, for example "Example ready". */
export function WorkspaceStatus({ label }: { label: string }) {
  return (
    <span className="rounded-full border bg-secondary/60 px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
      {label}
    </span>
  );
}
