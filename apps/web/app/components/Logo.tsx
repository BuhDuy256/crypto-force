import { Link } from 'react-router';

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-md text-xl font-semibold tracking-[-0.03em] text-foreground no-underline"
    >
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect
          x=".5"
          y=".5"
          width="29"
          height="29"
          rx="8"
          className="fill-secondary stroke-border"
        />
        <path d="M8 13.5l7-7 7 7z" className="fill-success" />
        <path d="M8 16.5l7 7 7-7z" className="fill-foreground" />
      </svg>
      Crypto Force
    </Link>
  );
}
