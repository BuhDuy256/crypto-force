import { useState, type KeyboardEvent } from 'react';
import type { StrategyLibraryItem } from '@crypto-force/shared';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { useBacktestRuns } from '~/hooks/useBacktests';
import {
  useDeleteStrategy,
  useDuplicateStrategy,
  useRenameStrategy,
  useRestoreStrategy,
} from '~/hooks/useStrategies';
import { cn } from '~/utils/cn';

const TOAST_DURATION_MS = 8000;
const RECENT_RUN_LIMIT = 5;

interface StrategyDetailDrawerProps {
  item: StrategyLibraryItem;
  items: StrategyLibraryItem[];
  isSignalSource: boolean;
  onUseAsSignalSource: (item: StrategyLibraryItem) => void;
  onOpenItem: (item: StrategyLibraryItem) => void;
  onClose: () => void;
}

function typeLabel(item: StrategyLibraryItem): string {
  return item.kind === 'composite' ? 'Composite' : 'Strategy';
}

function voteLabel(item: StrategyLibraryItem): string {
  return item.voteMethod === 'weighted' ? 'Weighted vote' : 'Majority vote';
}

function weightLabel(item: StrategyLibraryItem, index: number): string {
  if (item.voteMethod !== 'weighted') return 'weight equal';
  return `weight ${(item.weights?.[index] ?? 0).toFixed(2)}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function StrategyDetailDrawer({
  item,
  items,
  isSignalSource,
  onUseAsSignalSource,
  onOpenItem,
  onClose,
}: StrategyDetailDrawerProps) {
  const runsQuery = useBacktestRuns();
  const renameMutation = useRenameStrategy();
  const duplicateMutation = useDuplicateStrategy();
  const deleteMutation = useDeleteStrategy();
  const restoreMutation = useRestoreStrategy();

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const recentRuns = (runsQuery.data?.runs ?? [])
    .filter((run) => run.strategyId === item.id)
    .slice(0, RECENT_RUN_LIMIT);
  const editHref =
    item.kind === 'composite' ? '/discovery' : `/strategy?edit=${encodeURIComponent(item.id)}`;
  const editLabel =
    item.kind === 'composite' ? 'Edit in Composite builder' : 'Edit in Strategy Engine';

  function startRename(): void {
    setRenameValue(item.name);
    setRenameError(null);
    setRenaming(true);
  }

  function cancelRename(): void {
    setRenameError(null);
    setRenaming(false);
  }

  async function saveRename(): Promise<void> {
    const name = renameValue.trim();
    if (name === '') {
      setRenameError('Enter a name.');
      return;
    }
    const duplicate = items.some(
      (entry) => entry.id !== item.id && entry.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setRenameError(`Another item is already called “${name}”.`);
      return;
    }
    try {
      const renamed = await renameMutation.mutateAsync({ id: item.id, input: { name } });
      setRenaming(false);
      setRenameValue(renamed.name);
      setRenameError(null);
      toast(`Renamed to ${renamed.name}.`);
    } catch (error) {
      setRenameError(errorMessage(error, 'Could not rename this item.'));
    }
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveRename();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelRename();
    }
  }

  async function handleDuplicate(): Promise<void> {
    try {
      const copy = await duplicateMutation.mutateAsync(item.id);
      setRenameValue(copy.name);
      setRenameError(null);
      setRenaming(true);
      onOpenItem(copy);
      toast(`Duplicated as ${copy.name}. Rename it, then edit its rules.`);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not duplicate this item.'));
    }
  }

  async function handleDelete(): Promise<void> {
    const deleted = item;
    try {
      await deleteMutation.mutateAsync(deleted.id);
      setDeleteDialogOpen(false);
      onClose();
      toast(`Deleted ${deleted.name}.`, {
        duration: TOAST_DURATION_MS,
        action: {
          label: 'Undo',
          onClick: () => {
            restoreMutation.mutate(deleted.id);
          },
        },
      });
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete this item.'));
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="flex-row items-start gap-3 border-b p-5 pr-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{typeLabel(item)}</Badge>
              {isSignalSource ? <Badge variant="success">Realtime signal source</Badge> : null}
            </div>
            {renaming ? (
              <>
                <SheetTitle className="sr-only">{item.name}</SheetTitle>
                <Label htmlFor="strategy-rename" className="text-sm font-semibold">
                  Name
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="strategy-rename"
                    autoFocus
                    value={renameValue}
                    maxLength={60}
                    aria-invalid={renameError !== null}
                    aria-describedby="strategy-rename-message"
                    onChange={(event) => {
                      setRenameValue(event.target.value);
                      setRenameError(null);
                    }}
                    onKeyDown={handleRenameKeyDown}
                    className="min-w-0 flex-1 basis-48"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      void saveRename();
                    }}
                    disabled={renameMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelRename}>
                    Cancel
                  </Button>
                </div>
                <span
                  id="strategy-rename-message"
                  className={cn(
                    'text-sm',
                    renameError === null ? 'text-muted-foreground' : 'text-destructive',
                  )}
                >
                  {renameError ??
                    'Up to 60 characters. Renaming doesn’t change the rules or past runs.'}
                </span>
              </>
            ) : (
              <SheetTitle className="text-2xl leading-tight break-words">{item.name}</SheetTitle>
            )}
          </div>
        </SheetHeader>
        <SheetDescription className="sr-only">
          Rules, recent backtest runs, and actions for this library item.
        </SheetDescription>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                { label: 'Version', value: item.version },
                { label: 'Source', value: item.source },
                { label: 'Updated', value: item.updatedAt },
                { label: 'Created', value: item.createdAt },
              ].map(({ label, value }) => (
                <div key={label} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="drawer-rules" className="flex flex-col gap-2">
              <h3 id="drawer-rules" className="text-[15px] font-semibold">
                Rules
              </h3>
              <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground">
                {item.rules.map((rule) => (
                  <li key={rule} className="break-words">
                    {rule}
                  </li>
                ))}
              </ul>
            </section>

            {item.kind === 'composite' ? (
              <section aria-labelledby="drawer-blocks" className="flex flex-col gap-2">
                <h3 id="drawer-blocks" className="text-[15px] font-semibold">
                  Building blocks · {voteLabel(item)}
                </h3>
                <ul className="divide-y border-t text-sm">
                  {(item.blocks ?? []).map((block, index) => (
                    <li key={`${block}-${index}`} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1 break-words">{block}</span>
                      <span className="text-muted-foreground">{weightLabel(item, index)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {item.kind === 'strategy' && item.inputMode === 'prompt' && item.prompt ? (
              <section aria-labelledby="drawer-description" className="flex flex-col gap-2">
                <h3 id="drawer-description" className="text-[15px] font-semibold">
                  Description
                </h3>
                <p className="text-sm leading-relaxed break-words text-muted-foreground">
                  {item.prompt}
                </p>
              </section>
            ) : null}

            {item.kind === 'strategy' && item.inputMode === 'url' && item.url ? (
              <section aria-labelledby="drawer-source" className="flex flex-col gap-2">
                <h3 id="drawer-source" className="text-[15px] font-semibold">
                  Imported from
                </h3>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm break-all underline underline-offset-4"
                >
                  {item.url}
                </a>
              </section>
            ) : null}

            <section aria-labelledby="drawer-runs" className="flex flex-col gap-2">
              <h3 id="drawer-runs" className="text-[15px] font-semibold">
                Backtest runs
              </h3>
              {runsQuery.isPending ? (
                <div className="flex flex-col gap-2" aria-busy="true">
                  <span className="h-5 w-full animate-pulse rounded-md bg-accent" />
                  <span className="h-5 w-full animate-pulse rounded-md bg-accent" />
                </div>
              ) : recentRuns.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Not backtested yet. Each run keeps a copy of the configuration it ran with, so
                  editing this later does not change past results.
                </p>
              ) : (
                <ul className="divide-y border-t text-sm">
                  {recentRuns.map((run) => (
                    <li
                      key={run.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5"
                    >
                      <Link
                        to={`/backtest?run=${encodeURIComponent(run.id)}`}
                        className="min-w-0 flex-1 break-words underline underline-offset-4"
                      >
                        {run.strategyName} · {run.id}
                      </Link>
                      <span
                        className={cn(
                          'text-muted-foreground',
                          run.status === 'failed' && 'text-destructive',
                        )}
                      >
                        {run.status === 'running'
                          ? `Running ${run.progressPercent}%`
                          : run.resultLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <SheetFooter className="border-t p-5">
          <div className="flex flex-wrap gap-2">
            <Button asChild className="flex-1 basis-36">
              <Link
                to={`/backtest?strategy=${encodeURIComponent(item.id)}`}
                state={{ from: 'your library' }}
              >
                Backtest
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 basis-36">
              <Link to={editHref}>{editLabel}</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSignalSource}
              onClick={() => {
                onUseAsSignalSource(item);
              }}
            >
              {isSignalSource ? 'Current signal source' : 'Use as signal source'}
            </Button>
            <Button type="button" variant="outline" onClick={startRename}>
              Rename
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleDuplicate();
              }}
              disabled={duplicateMutation.isPending}
            >
              Duplicate
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={() => {
                setDeleteDialogOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        </SheetFooter>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete “{item.name}”?</DialogTitle>
              <DialogDescription>
                It will be removed from your library and from strategy pickers. Past backtest runs
                keep their own copy of this configuration and stay in Backtest.
                {isSignalSource ? (
                  <span className="mt-2 block text-warning">
                    This is Realtime’s signal source. Realtime will switch back to MA Crossover.
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
