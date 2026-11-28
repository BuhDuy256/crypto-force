import { useState } from 'react';
import type { StrategyPreviewResponse } from '@crypto-force/shared';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { WorkspaceStatus } from './WorkspaceStatus';

interface StrategySaveCardProps {
  preview: StrategyPreviewResponse | null;
  versionLabel: string;
  name: string;
  nameError: string | null;
  tags: string[];
  source: string;
  isEditing: boolean;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onTagsChange: (tags: string[]) => void;
  onSave: () => void;
  statusLabel: string;
  className?: string;
}

export function StrategySaveCard({
  preview,
  versionLabel,
  name,
  nameError,
  tags,
  source,
  isEditing,
  isPending,
  onNameChange,
  onNameBlur,
  onTagsChange,
  onSave,
  statusLabel,
  className,
}: StrategySaveCardProps) {
  const [showChecks, setShowChecks] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  function removeTag(tag: string): void {
    const previousTags = tags;
    onTagsChange(tags.filter((current) => current !== tag));
    toast(`Removed tag "${tag}".`, {
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => {
          onTagsChange(previousTags);
        },
      },
    });
  }

  function addTag(): void {
    const tag = tagDraft.trim();
    if (tag === '') return;
    if (!tags.includes(tag)) onTagsChange([...tags, tag]);
    setTagDraft('');
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-semibold">Validation &amp; actions</h2>
          <WorkspaceStatus label={statusLabel} />
        </div>
        <CardDescription>
          Check the example rules, then name and save your strategy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {preview === null ? (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-lg border border-dashed p-6 text-sm"
          >
            <strong className="text-base">Awaiting a strategy preview</strong>
            <p className="text-muted-foreground">
              Review the sample rules first. Validation and save controls will appear here
              afterward.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Check className="size-4 text-success" aria-hidden="true" />
                <span className="flex-1">
                  <strong>Example validation checks.</strong> These values illustrate the review UI;
                  this prototype does not run rule validation.
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-info underline"
                  aria-expanded={showChecks}
                  onClick={() => {
                    setShowChecks((current) => !current);
                  }}
                >
                  {showChecks ? 'Hide checks' : 'Show checks'}
                </Button>
              </div>
              {showChecks ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {preview.checks.map((check) => (
                    <li key={check.title} className="flex items-center gap-2">
                      <Check className="size-4 text-success" aria-hidden="true" />
                      <span className="font-semibold">{check.title}</span>
                      <span className="text-muted-foreground">{check.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="strategy-save-name">Name</Label>
                <Input
                  id="strategy-save-name"
                  maxLength={60}
                  value={name}
                  aria-invalid={nameError !== null}
                  aria-describedby={nameError === null ? undefined : 'strategy-save-name-error'}
                  onChange={(event) => {
                    onNameChange(event.target.value);
                  }}
                  onBlur={onNameBlur}
                />
                {nameError === null ? null : (
                  <p id="strategy-save-name-error" className="text-sm text-destructive">
                    {nameError}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Version</span>
                <output className="flex h-9 items-center text-sm text-muted-foreground">
                  {versionLabel}
                </output>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Tags</span>
              <div className="flex min-h-9 flex-wrap items-center gap-2 rounded-md border border-input px-2 py-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded bg-secondary py-0.5 pr-1 pl-2 text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                      className="flex size-6 items-center justify-center rounded hover:bg-accent"
                      onClick={() => {
                        removeTag(tag);
                      }}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  aria-label="Add tag"
                  placeholder="Add tag"
                  value={tagDraft}
                  className="min-w-20 flex-1 bg-transparent text-xs outline-none"
                  onChange={(event) => {
                    setTagDraft(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    addTag();
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Source</span>
              <span className="text-sm text-muted-foreground">{source}</span>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={isPending}
              aria-busy={isPending}
              onClick={onSave}
            >
              {isEditing ? 'Save changes' : 'Save strategy'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
