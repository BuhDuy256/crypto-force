import { useState, type JSX } from 'react';
import type { StrategyLibraryItem } from '@crypto-force/shared';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { useStrategyList } from '~/hooks/useStrategies';
import { cn } from '~/utils/cn';
import { StrategyDetailDrawer } from './components/StrategyDetailDrawer';

type LibraryFilter = 'all' | 'strategy' | 'composite';

const SIGNAL_SOURCE_STORAGE_KEY = 'cf.signal-source-id';
const SKELETON_ROWS = [0, 1, 2, 3];

function readSignalSourceId(): string | null {
  try {
    return window.localStorage.getItem(SIGNAL_SOURCE_STORAGE_KEY);
  } catch {
    // A blocked storage only keeps the signal source for this visit.
    return null;
  }
}

function writeSignalSourceId(id: string): void {
  try {
    window.localStorage.setItem(SIGNAL_SOURCE_STORAGE_KEY, id);
  } catch {
    // A blocked storage only keeps the signal source for this visit.
  }
}

function matchesSearch(item: StrategyLibraryItem, query: string): boolean {
  if (query === '') return true;
  return (
    item.name.toLowerCase().includes(query) ||
    item.tags.some((tag) => tag.toLowerCase().includes(query))
  );
}

function itemTypeLabel(item: StrategyLibraryItem): string {
  return item.kind === 'composite' ? 'Composite' : 'Strategy';
}

function itemRunSummary(item: StrategyLibraryItem): string {
  return item.lastRunSummary === null ? 'Not backtested yet' : `Last run ${item.lastRunSummary}`;
}

export function StrategyLibraryPage(): JSX.Element {
  const navigate = useNavigate();
  const query = useStrategyList();
  const items = query.data?.items ?? [];
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [search, setSearch] = useState('');
  const [signalSourceId, setSignalSourceId] = useState<string | null>(readSignalSourceId);
  const [duplicatedItem, setDuplicatedItem] = useState<StrategyLibraryItem | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const strategyCount = items.filter((item) => item.kind === 'strategy').length;
  const compositeCount = items.length - strategyCount;
  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter(
    (item) => (filter === 'all' || item.kind === filter) && matchesSearch(item, normalizedSearch),
  );
  const signalSourceItem = items.find((item) => item.id === signalSourceId) ?? null;
  const signalSourceLabel = signalSourceItem?.name ?? 'MA Crossover (built-in)';

  const openId = searchParams.get('open');
  const openItem =
    openId === null
      ? null
      : (items.find((item) => item.id === openId) ??
        (duplicatedItem?.id === openId ? duplicatedItem : null));

  function setOpenId(id: string): void {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('open', id);
        return next;
      },
      { replace: true },
    );
  }

  function openLibraryItem(item: StrategyLibraryItem): void {
    setDuplicatedItem(null);
    setOpenId(item.id);
  }

  function closeDrawer(): void {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('open');
        return next;
      },
      { replace: true },
    );
    setDuplicatedItem(null);
  }

  function handleUseAsSignalSource(item: StrategyLibraryItem): void {
    setSignalSourceId(item.id);
    writeSignalSourceId(item.id);
    toast(`${item.name} is now the Realtime signal source.`, {
      action: {
        label: 'Open Realtime',
        onClick: () => {
          void navigate('/realtime');
        },
      },
    });
  }

  const filters: Array<{ key: LibraryFilter; label: string; count: number }> = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'strategy', label: 'Strategies', count: strategyCount },
    { key: 'composite', label: 'Composites', count: compositeCount },
  ];

  return (
    <section className="mx-auto flex w-full max-w-page flex-col gap-6 p-4 sm:p-7">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link to="/strategy" className="font-semibold">
          Strategy Engine
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Library</span>
      </nav>

      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto flex min-w-0 flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Strategy library</h1>
          <p className="text-sm text-muted-foreground">
            Saved strategies and composites. Open one to see its rules, edit it, or use it in
            Backtest and Realtime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/strategy">New strategy</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/discovery">New composite</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
            {filters.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => {
                  setFilter(key);
                }}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm',
                  filter === key
                    ? 'border-info bg-info/10 font-semibold text-foreground'
                    : 'border-input text-foreground hover:bg-accent',
                )}
              >
                {label}
                <span className="text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto w-full max-w-xs">
            <label htmlFor="library-search" className="sr-only">
              Search the library
            </label>
            <Input
              id="library-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search by name or tag"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Realtime signal source:{' '}
          <strong className="font-semibold text-foreground">{signalSourceLabel}</strong>
        </p>

        {query.isPending ? (
          <div className="mt-4 flex flex-col gap-3" aria-busy="true">
            {SKELETON_ROWS.map((row) => (
              <Skeleton key={row} className="h-16 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Could not load your library</AlertTitle>
            <AlertDescription>
              <p>{query.error.message}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void query.refetch();
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <div
            role="status"
            className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center"
          >
            <strong className="text-base">Your library is empty</strong>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Save a strategy from Strategy Engine, or a composite from Discovery, and it will
              appear here.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/strategy">Create a strategy</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/discovery">Build a composite</Link>
              </Button>
            </div>
          </div>
        ) : visibleItems.length === 0 ? (
          <div
            role="status"
            className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center"
          >
            <strong className="text-base">Nothing matches “{search.trim()}”</strong>
            <p className="text-sm text-muted-foreground">
              Try another name or tag, or show every type.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear search and filters
            </Button>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col border-t">
            {visibleItems.map((item) => {
              const isSignalSource = signalSourceItem?.id === item.id;
              const editHref =
                item.kind === 'composite'
                  ? '/discovery'
                  : `/strategy?edit=${encodeURIComponent(item.id)}`;
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 border-b py-4 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 basis-90 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          openLibraryItem(item);
                        }}
                        className="text-left text-base font-bold break-words underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        {item.name}
                      </button>
                      <Badge variant="outline">{itemTypeLabel(item)}</Badge>
                      {isSignalSource ? (
                        <Badge variant="success">Realtime signal source</Badge>
                      ) : null}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.source} · v{item.version} · Updated {item.updatedAt}
                    </span>
                    {item.tags.length > 0 ? (
                      <span className="text-sm text-muted-foreground">{item.tags.join(' · ')}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="text-sm text-muted-foreground">{itemRunSummary(item)}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={`/backtest?strategy=${encodeURIComponent(item.id)}`}
                        state={{ from: 'your library' }}
                      >
                        Backtest
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={editHref}>Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Details for ${item.name}`}
                      onClick={() => {
                        openLibraryItem(item);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {openItem !== null ? (
        <StrategyDetailDrawer
          item={openItem}
          items={items}
          isSignalSource={signalSourceItem?.id === openItem.id}
          onUseAsSignalSource={handleUseAsSignalSource}
          onOpenItem={(copy) => {
            setDuplicatedItem(copy);
            setOpenId(copy.id);
          }}
          onClose={closeDrawer}
        />
      ) : null}
    </section>
  );
}
