import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useStrategyList } from '~/hooks/useStrategies';

export function RecentLibraryCard() {
  const query = useStrategyList();
  const items = query.data?.items.slice(0, 3) ?? [];
  const totalCount = query.data?.totalCount ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline">
          <h2 className="text-lg font-semibold">Your library</h2>
          <span className="ml-3 text-xs text-muted-foreground">Most recently saved</span>
          <Link to="/library" className="ml-auto text-sm font-semibold">
            View all ({totalCount})
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
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
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Preview the rules above, then save to add your first strategy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-semibold">Name</th>
                  <th className="font-semibold">Type</th>
                  <th className="font-semibold">Source</th>
                  <th className="font-semibold">Updated</th>
                  <th className="font-semibold">Version</th>
                  <th className="font-semibold">Tags</th>
                  <th className="font-semibold">Last backtest</th>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 pr-3 font-semibold">{item.name}</td>
                    <td>{item.kind === 'composite' ? 'Composite' : 'Strategy'}</td>
                    <td>
                      <span className="rounded border px-2 py-0.5 text-xs font-semibold">
                        {item.source}
                      </span>
                    </td>
                    <td>{item.updatedAt}</td>
                    <td>{item.version}</td>
                    <td className="text-muted-foreground">
                      {item.tags.length === 0 ? '—' : item.tags.join(', ')}
                    </td>
                    <td className="text-muted-foreground">
                      {item.lastRunSummary ?? 'Not backtested yet'}
                    </td>
                    <td className="text-right">
                      <span className="inline-flex gap-2">
                        <Link
                          to={`/backtest?strategy=${encodeURIComponent(item.id)}`}
                          className="inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
                        >
                          Backtest
                        </Link>
                        <Link
                          to={`/library?open=${encodeURIComponent(item.id)}`}
                          aria-label={`Open ${item.name} in the library`}
                          className="inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
                        >
                          Open
                        </Link>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
