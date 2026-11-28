import type { StrategyInputMode } from '@crypto-force/shared';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/utils/cn';

const PROMPT_MAX_LENGTH = 1000;

interface StrategyInputCardProps {
  inputMode: StrategyInputMode;
  prompt: string;
  url: string;
  urlError: string | null;
  isPending: boolean;
  onInputModeChange: (mode: StrategyInputMode) => void;
  onPromptChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onPreview: () => void;
  onClear: () => void;
}

export function StrategyInputCard({
  inputMode,
  prompt,
  url,
  urlError,
  isPending,
  onInputModeChange,
  onPromptChange,
  onUrlChange,
  onPreview,
  onClear,
}: StrategyInputCardProps) {
  const promptCount = prompt.length;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Strategy input</h2>
        <CardDescription>
          Describe or import a strategy. You can return and revise it at any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div role="tablist" aria-label="Input type" className="flex border-b">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'prompt'}
            tabIndex={inputMode === 'prompt' ? 0 : -1}
            onClick={() => {
              onInputModeChange('prompt');
            }}
            className={cn(
              '-mb-px min-h-10 border-b-2 px-4 text-sm font-semibold',
              inputMode === 'prompt'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Describe it
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'url'}
            tabIndex={inputMode === 'url' ? 0 : -1}
            onClick={() => {
              onInputModeChange('url');
            }}
            className={cn(
              '-mb-px min-h-10 border-b-2 px-4 text-sm font-semibold',
              inputMode === 'url'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Import from a link
          </button>
        </div>

        {inputMode === 'prompt' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onPreview();
            }}
          >
            <Label htmlFor="strategy-prompt">Describe your trading strategy</Label>
            <Textarea
              id="strategy-prompt"
              rows={7}
              maxLength={PROMPT_MAX_LENGTH}
              value={prompt}
              onChange={(event) => {
                onPromptChange(event.target.value);
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mention entry, exit, stop loss and take profit if you have them.</span>
              <span>
                {promptCount}/{PROMPT_MAX_LENGTH}
              </span>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isPending} aria-busy={isPending}>
                {isPending ? 'Preparing preview…' : 'Preview example rules'}
              </Button>
              <Button type="button" variant="outline" onClick={onClear}>
                Clear
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onPreview();
            }}
          >
            <Label htmlFor="strategy-url">Link to a strategy write-up</Label>
            <Input
              id="strategy-url"
              type="url"
              value={url}
              aria-invalid={urlError !== null}
              aria-describedby={urlError === null ? 'strategy-url-help' : 'strategy-url-error'}
              onChange={(event) => {
                onUrlChange(event.target.value);
              }}
            />
            {urlError === null ? null : (
              <p id="strategy-url-error" className="text-sm text-destructive">
                {urlError}
              </p>
            )}
            <p id="strategy-url-help" className="text-xs text-muted-foreground">
              Paste a public strategy URL. Source compatibility depends on the importer.
            </p>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending ? 'Reading page…' : 'Extract from page'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
