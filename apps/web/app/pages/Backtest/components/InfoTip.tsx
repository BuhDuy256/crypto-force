import { useId, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * An info button for a label. The explanation opens on hover, keyboard focus, or a tap. The
 * pointer can move onto the explanation, and Escape closes it (WCAG 1.4.13).
 */
export function InfoTip({
  label,
  explanation,
  align = 'start',
}: {
  label: string;
  explanation: string;
  align?: 'start' | 'end';
}) {
  const tipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
      onFocus={() => {
        setOpen(true);
      }}
      onBlur={() => {
        setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return;
        event.stopPropagation();
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-describedby={tipId}
        className="inline-flex size-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        id={tipId}
        hidden={!open}
        className={`absolute top-full z-20 w-64 max-w-[calc(100vw-2rem)] pt-1 text-xs leading-relaxed font-normal normal-case ${align === 'end' ? 'right-0' : 'left-0'}`}
      >
        <span className="block rounded-md border bg-popover p-2.5 text-popover-foreground shadow-md">
          {explanation}
        </span>
      </span>
    </span>
  );
}
