interface ScreenPlaceholderProps {
  title: string;
}

/** Stands in for a workspace screen until the increment that builds it. */
export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-3 px-4 py-10 sm:px-7">
      <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="m-0 text-muted-foreground">This screen is not built yet.</p>
    </div>
  );
}
