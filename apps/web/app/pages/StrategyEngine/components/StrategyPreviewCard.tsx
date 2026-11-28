import { useState } from 'react';
import type { StrategyPreviewResponse } from '@crypto-force/shared';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

interface StrategyPreviewCardProps {
  preview: StrategyPreviewResponse | null;
  isPending: boolean;
  errorMessage: string | null;
  hasShort: boolean;
  onRetry: () => void;
  onHasShortChange: (value: boolean) => void;
}

export function StrategyPreviewCard({
  preview,
  isPending,
  errorMessage,
  hasShort,
  onRetry,
  onHasShortChange,
}: StrategyPreviewCardProps) {
  const [showJson, setShowJson] = useState(false);

  async function copyJson(): Promise<void> {
    if (preview === null) return;
    try {
      await navigator.clipboard.writeText(preview.definitionJson);
      toast.success('Strategy JSON copied to the clipboard.');
    } catch {
      toast.error('Could not copy the JSON. Select the text and copy it manually.');
    }
  }

  function removeShort(): void {
    onHasShortChange(false);
    toast('Short example removed.', {
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => {
          onHasShortChange(true);
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Strategy preview</h2>
        <CardDescription>Inspect rules, assumptions and the example definition.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : errorMessage !== null ? (
          <Alert variant="destructive">
            <AlertTitle>Preview failed</AlertTitle>
            <AlertDescription>
              <p>{errorMessage}</p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : preview === null ? (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-lg border border-dashed p-6 text-sm"
          >
            <strong className="text-base">No preview yet</strong>
            <p className="text-muted-foreground">
              Use <strong>Preview example rules</strong> to inspect an illustrative rule set. This
              prototype does not analyze the text you entered.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-info/40 bg-info/10 p-3 text-sm leading-relaxed">
              <strong>Illustrative example only.</strong> These sample rules are not generated from
              the current input. Confirm the rules and assumptions before applying them to any
              backtest.
            </div>

            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="border-b align-top">
                  <th
                    scope="row"
                    className="w-[32%] py-3 pr-4 text-left font-semibold text-success"
                  >
                    Go long
                  </th>
                  <td className="py-3">{preview.rules[0] ?? 'No long rule recorded.'}</td>
                </tr>
                {hasShort ? (
                  <tr className="border-b align-top">
                    <th
                      scope="row"
                      className="w-[32%] py-3 pr-4 text-left font-semibold text-destructive"
                    >
                      Short condition (example)
                    </th>
                    <td className="py-3">{preview.shortRuleText}</td>
                  </tr>
                ) : null}
                <tr className="border-b">
                  <th scope="row" className="py-3 pr-4 text-left font-semibold">
                    Risk
                  </th>
                  <td className="py-3">{preview.riskSummary}</td>
                </tr>
                <tr className="border-b">
                  <th scope="row" className="py-3 pr-4 text-left font-semibold">
                    Timeframe
                  </th>
                  <td className="py-3">{preview.assumedTimeframe}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 text-left font-semibold">
                    Pairs
                  </th>
                  <td className="py-3">{preview.assumedPairs}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-4">
              <h3 className="text-sm font-semibold text-warning">Review the assumptions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {preview.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
                {hasShort ? (
                  <li>
                    A mirrored SHORT rule is shown as an example. Confirm whether short positions
                    belong in this strategy.{' '}
                    <Button type="button" variant="link" size="sm" onClick={removeShort}>
                      Remove short example
                    </Button>
                  </li>
                ) : null}
              </ul>
              <p className="text-xs text-muted-foreground">
                Confirm these assumptions before saving. Edit your description and analyze again to
                change them.
              </p>
            </div>

            <div className="rounded-lg border">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <h3 className="text-sm font-semibold">Strategy definition (JSON)</h3>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-expanded={showJson}
                    onClick={() => {
                      setShowJson((current) => !current);
                    }}
                  >
                    {showJson ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void copyJson();
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              {showJson ? (
                <pre className="max-h-[300px] overflow-auto p-3 font-mono text-xs leading-relaxed">
                  {preview.definitionJson}
                </pre>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
