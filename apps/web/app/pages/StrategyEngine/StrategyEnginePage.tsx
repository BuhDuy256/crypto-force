import { useRef, useState, type JSX } from 'react';
import type {
  StrategyInputMode,
  StrategyLibraryItem,
  StrategyPreviewResponse,
} from '@crypto-force/shared';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  useCreateStrategy,
  usePreviewStrategy,
  useStrategyDraftSync,
  useStrategyList,
  useUpdateStrategy,
} from '~/hooks/useStrategies';
import {
  bumpPatchVersion,
  clearStrategyDraft,
  isStrategyDraftDirty,
  readStrategyDraft,
  type StrategyDraftSnapshot,
} from '~/utils/strategy-draft';
import { RecentLibraryCard } from './components/RecentLibraryCard';
import { StrategyInputCard } from './components/StrategyInputCard';
import { StrategyPreviewCard } from './components/StrategyPreviewCard';
import { StrategySaveCard } from './components/StrategySaveCard';

interface EngineForm {
  inputMode: StrategyInputMode;
  prompt: string;
  url: string;
  tags: string[];
  saveName: string;
  hasShort: boolean;
}

type DraftContent = Omit<StrategyDraftSnapshot, 'savedAt'>;

const URL_PATTERN = /^https?:\/\/[^\s/]+\.[^\s/]+/;
const DESCRIPTION_CLEARED_DURATION_MS = 8000;

function emptyForm(): EngineForm {
  return { inputMode: 'prompt', prompt: '', url: '', tags: [], saveName: '', hasShort: false };
}

function hasShortRule(rules: readonly string[]): boolean {
  return rules.some((rule) => rule.trim().toUpperCase().startsWith('SHORT'));
}

function formFromItem(item: StrategyLibraryItem): EngineForm {
  return {
    inputMode: item.inputMode ?? 'prompt',
    prompt: item.prompt ?? '',
    url: item.url ?? '',
    tags: [...item.tags],
    saveName: item.name,
    hasShort: hasShortRule(item.rules),
  };
}

function formFromDraft(draft: StrategyDraftSnapshot): EngineForm {
  return {
    inputMode: draft.inputMode,
    prompt: draft.prompt,
    url: draft.url,
    tags: [...draft.tags],
    saveName: draft.saveName,
    hasShort: draft.hasShort,
  };
}

function toDraftContent(form: EngineForm, editId: string | null): DraftContent {
  return {
    editId,
    inputMode: form.inputMode,
    prompt: form.prompt,
    url: form.url,
    tags: form.tags,
    saveName: form.saveName,
    hasShort: form.hasShort,
  };
}

function isValidStrategyUrl(value: string): boolean {
  return URL_PATTERN.test(value);
}

function rulesForSave(preview: StrategyPreviewResponse, hasShort: boolean): string[] {
  if (hasShort) return preview.rules;
  return preview.rules.filter((rule) => rule.trim() !== preview.shortRuleText.trim());
}

/** Returns the name, or the name with the first free number when the library already has it. */
function freeName(base: string, items: StrategyLibraryItem[], exceptId: string | null): string {
  const taken = new Set(
    items.filter((item) => item.id !== exceptId).map((item) => item.name.trim().toLowerCase()),
  );
  if (!taken.has(base.toLowerCase())) return base;
  for (let number = 2; number < 100; number += 1) {
    const candidate = `${base.slice(0, 60 - String(number).length - 1)} ${String(number)}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return base;
}

function previewFromItem(item: StrategyLibraryItem): StrategyPreviewResponse {
  const shortRule = item.rules.find((rule) => rule.trim().toUpperCase().startsWith('SHORT'));
  const riskRules = item.rules.filter((rule) => /stop loss|take profit/i.test(rule));

  return {
    inputMode: item.inputMode ?? 'prompt',
    source: item.source,
    rules: item.rules,
    hasShortExample: shortRule !== undefined,
    shortRuleText: shortRule ?? 'No SHORT rule in this example.',
    riskSummary:
      riskRules.length === 0
        ? 'Risk settings come from the saved strategy.'
        : riskRules.join(' · '),
    assumedTimeframe: '1h',
    assumedPairs: 'All USDT pairs, spot',
    assumptions: [
      'These rules come from your saved strategy. Confirm them before testing.',
      'No timeframe or pairs are stored with this example preview. Confirm the intended markets.',
    ],
    definitionJson: JSON.stringify(
      { name: item.name, version: item.version, rules: item.rules },
      null,
      2,
    ),
    checks: [
      { title: 'Required fields', detail: 'None missing', passed: true },
      { title: 'Logic', detail: 'Consistent', passed: true },
      { title: 'Indicators', detail: 'All supported', passed: true },
    ],
    suggestedName: item.name,
    suggestedTags: [...item.tags],
  };
}

export function StrategyEnginePage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  return <StrategyEngineContent key={editId ?? 'new'} editId={editId} />;
}

function StrategyEngineContent({ editId }: { editId: string | null }) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const listQuery = useStrategyList();
  const items = listQuery.data?.items ?? [];
  const totalCount = listQuery.data?.totalCount ?? 0;
  const editItem = editId === null ? null : (items.find((item) => item.id === editId) ?? null);

  const [initialDraft] = useState<StrategyDraftSnapshot | null>(() => {
    const draft = readStrategyDraft(window.localStorage);
    return draft !== null && draft.editId === editId ? draft : null;
  });
  const [draftActive, setDraftActive] = useState(initialDraft !== null);
  const [draftBannerVisible, setDraftBannerVisible] = useState(initialDraft !== null);
  const [formOverride, setFormOverride] = useState<EngineForm | null>(null);
  const [savedBaseline, setSavedBaseline] = useState<EngineForm | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [stopEditOpen, setStopEditOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [previewState, setPreviewState] = useState<StrategyPreviewResponse | null | undefined>(
    undefined,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequestId = useRef(0);
  const previewMutation = usePreviewStrategy();
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();

  const baseline = savedBaseline ?? (editItem === null ? emptyForm() : formFromItem(editItem));
  const draftForm = initialDraft === null ? null : formFromDraft(initialDraft);
  const form = formOverride ?? (draftActive && draftForm !== null ? draftForm : baseline);
  const derivedPreview = editItem === null ? null : previewFromItem(editItem);
  const preview = previewState === undefined ? derivedPreview : previewState;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useStrategyDraftSync({
    current: toDraftContent(form, editId),
    baseline: toDraftContent(baseline, editId),
    enabled: editId === null || editItem !== null || draftActive,
  });

  const trimmedName = form.saveName.trim();
  const duplicateName =
    trimmedName !== '' &&
    items.some(
      (item) => item.id !== editId && item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
  const nameError = duplicateName
    ? 'Your library already has that name. Enter another name.'
    : nameTouched && trimmedName === ''
      ? 'Enter a strategy name.'
      : null;

  function patchForm(patch: Partial<EngineForm>): void {
    setJustSaved(false);
    setFormOverride((current) => ({ ...(current ?? form), ...patch }));
  }

  function resetPreview(): void {
    previewRequestId.current += 1;
    previewMutation.reset();
    setPreviewError(null);
    setPreviewState(null);
  }

  function handleInputModeChange(mode: StrategyInputMode): void {
    if (mode === form.inputMode) return;
    patchForm({ inputMode: mode });
    setUrlError(null);
    resetPreview();
  }

  function handlePromptChange(value: string): void {
    patchForm({ prompt: value });
    resetPreview();
  }

  function handleUrlChange(value: string): void {
    patchForm({ url: value });
    setUrlError(null);
    resetPreview();
  }

  function handleClear(): void {
    const previousPrompt = form.prompt;
    patchForm({ prompt: '' });
    resetPreview();
    toast('Description cleared.', {
      duration: DESCRIPTION_CLEARED_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          patchForm({ prompt: previousPrompt });
        },
      },
    });
  }

  function handlePreview(): void {
    if (form.inputMode === 'url') {
      const trimmedUrl = form.url.trim();
      if (!isValidStrategyUrl(trimmedUrl)) {
        setUrlError('Enter a full link starting with https://');
        return;
      }
    } else if (form.prompt.trim() === '') {
      toast.error('Describe the entry, exit and stop loss of your strategy.');
      return;
    }

    setUrlError(null);
    setPreviewError(null);
    const requestId = previewRequestId.current + 1;
    previewRequestId.current = requestId;
    const input =
      form.inputMode === 'prompt'
        ? { inputMode: 'prompt' as const, prompt: form.prompt.trim() }
        : { inputMode: 'url' as const, url: form.url.trim() };

    previewMutation.mutate(input, {
      onSuccess: (data) => {
        if (previewRequestId.current !== requestId) return;
        setPreviewState(data);
        setJustSaved(false);
        setFormOverride((current) => {
          const base = current ?? form;
          return {
            ...base,
            hasShort: data.hasShortExample,
            saveName:
              base.saveName.trim() === ''
                ? freeName(data.suggestedName, items, editId)
                : base.saveName,
            tags: base.tags.length === 0 ? [...data.suggestedTags] : base.tags,
          };
        });
      },
      onError: (error) => {
        if (previewRequestId.current !== requestId) return;
        setPreviewError(error.message);
      },
    });
  }

  function handleDiscardDraft(): void {
    clearStrategyDraft(window.localStorage);
    setDraftActive(false);
    setDraftBannerVisible(false);
    setFormOverride(null);
    setNameTouched(false);
    previewRequestId.current += 1;
    previewMutation.reset();
    setPreviewError(null);
    setPreviewState(undefined);
  }

  function handleStopEditing(): void {
    if (isStrategyDraftDirty(toDraftContent(form, editId), toDraftContent(baseline, editId))) {
      setStopEditOpen(true);
      return;
    }
    clearStrategyDraft(window.localStorage);
    void navigate('/library');
  }

  function handleDiscardChanges(): void {
    clearStrategyDraft(window.localStorage);
    setStopEditOpen(false);
    void navigate('/library');
  }

  async function handleSave(): Promise<void> {
    setNameTouched(true);
    if (trimmedName === '') {
      toast.error('Enter a strategy name.');
      return;
    }
    if (duplicateName) {
      toast.error('Your library already has that name. Enter another name.');
      return;
    }
    if (preview === null) {
      toast.error('Open a strategy preview before saving.');
      return;
    }

    const input = {
      name: trimmedName,
      inputMode: form.inputMode,
      prompt: form.inputMode === 'prompt' ? form.prompt.trim() : null,
      url: form.inputMode === 'url' ? form.url.trim() : null,
      tags: form.tags,
      includeShortExample: form.hasShort,
      rules: rulesForSave(preview, form.hasShort),
    };

    try {
      const saved =
        editItem === null
          ? await createMutation.mutateAsync(input)
          : await updateMutation.mutateAsync({ id: editItem.id, input });

      clearStrategyDraft(window.localStorage);
      setDraftActive(false);
      setDraftBannerVisible(false);
      setSavedBaseline(formFromItem(saved));
      setFormOverride(formFromItem(saved));
      setPreviewState(undefined);
      setJustSaved(true);
      if (editItem === null) {
        setSearchParams({ edit: saved.id }, { replace: true });
      }

      toast.success(`Saved "${saved.name}".`, {
        duration: DESCRIPTION_CLEARED_DURATION_MS,
        action: {
          label: 'Backtest it',
          onClick: () => {
            void navigate(`/backtest?strategy=${encodeURIComponent(saved.id)}`, {
              state: { from: 'Strategy Engine' },
            });
          },
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the strategy.');
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-page flex-col gap-6 p-4 sm:p-7">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Strategy Engine</h1>
          <p className="text-sm text-muted-foreground">
            Describe a trading idea or add a public link. Review example rules, confirm assumptions,
            and refine your strategy.
          </p>
        </div>
        <Link to="/library" className="text-sm font-semibold">
          Strategy library ({totalCount})
        </Link>
      </div>

      {draftBannerVisible && initialDraft !== null ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
        >
          <span className="flex-1 text-warning">
            Restored your unsaved changes from {initialDraft.savedAt}.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleDiscardDraft}>
            Discard draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraftBannerVisible(false);
            }}
          >
            Keep
          </Button>
        </div>
      ) : null}

      {editItem !== null ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-info/40 bg-info/10 p-3 text-sm"
        >
          <span className="flex-1">
            <strong>Editing {editItem.name}</strong> · v{editItem.version}. Saving updates this
            strategy in your library. Past backtest runs keep the configuration they ran with.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleStopEditing}>
            Stop editing
          </Button>
        </div>
      ) : null}

      <div className="grid items-start gap-5 min-[1120px]:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] min-[1120px]:grid-rows-[auto_1fr]">
        <StrategyInputCard
          inputMode={form.inputMode}
          prompt={form.prompt}
          url={form.url}
          urlError={urlError}
          isPending={previewMutation.isPending}
          onInputModeChange={handleInputModeChange}
          onPromptChange={handlePromptChange}
          onUrlChange={handleUrlChange}
          onPreview={handlePreview}
          onClear={handleClear}
        />
        <StrategyPreviewCard
          className="min-[1120px]:col-start-2 min-[1120px]:row-span-2 min-[1120px]:row-start-1"
          preview={preview}
          isPending={previewMutation.isPending}
          errorMessage={previewError}
          hasShort={form.hasShort}
          onRetry={handlePreview}
          onHasShortChange={(value) => {
            patchForm({ hasShort: value });
          }}
        />
        <StrategySaveCard
          className="min-[1120px]:col-start-1 min-[1120px]:row-start-2"
          statusLabel={
            justSaved ? 'Saved' : preview === null ? 'Waiting for preview' : 'Example available'
          }
          preview={preview}
          versionLabel={
            editItem === null ? '1.0.0 auto' : `${bumpPatchVersion(editItem.version)} on save`
          }
          name={form.saveName}
          nameError={nameError}
          tags={form.tags}
          source={form.inputMode === 'url' ? 'Imported from a link' : 'Written by you'}
          isEditing={editItem !== null}
          isPending={isSaving}
          onNameChange={(value) => {
            patchForm({ saveName: value });
          }}
          onNameBlur={() => {
            setNameTouched(true);
          }}
          onTagsChange={(tags) => {
            patchForm({ tags });
          }}
          onSave={() => {
            void handleSave();
          }}
        />
      </div>

      <RecentLibraryCard />

      <Dialog open={stopEditOpen} onOpenChange={setStopEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes to {editItem?.name ?? form.saveName}?</DialogTitle>
            <DialogDescription>
              Your edits since the last save will be lost. The saved version in your library stays
              as it is.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStopEditOpen(false);
              }}
            >
              Keep editing
            </Button>
            <Button type="button" variant="destructive" onClick={handleDiscardChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
