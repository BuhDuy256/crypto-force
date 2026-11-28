import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateStrategyInput,
  RenameStrategyInput,
  StrategyLibraryItem,
  StrategyListResponse,
  StrategyPreviewRequest,
  StrategyPreviewResponse,
  UpdateStrategyInput,
} from '@crypto-force/shared';
import {
  clearStrategyDraft,
  isStrategyDraftDirty,
  writeStrategyDraft,
  type StrategyDraftSnapshot,
} from '~/utils/strategy-draft';
import {
  createStrategy,
  deleteStrategy,
  duplicateStrategy,
  listStrategies,
  previewStrategy,
  renameStrategy,
  restoreStrategy,
  updateStrategy,
} from '~/api/strategies';

type StrategyListFilters = { kind?: 'all' | 'strategy' | 'composite'; q?: string };

const strategyKeys = {
  all: ['strategies'] as const,
  list: (filters?: StrategyListFilters) => [...strategyKeys.all, 'list', filters ?? {}] as const,
};

export function useStrategyList(filters?: StrategyListFilters) {
  return useQuery<StrategyListResponse>({
    queryKey: strategyKeys.list(filters),
    queryFn: ({ signal }) => listStrategies(filters, signal),
  });
}

export function usePreviewStrategy() {
  return useMutation<StrategyPreviewResponse, Error, StrategyPreviewRequest>({
    mutationFn: (input) => previewStrategy(input),
  });
}

function useInvalidateStrategyLibrary() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: strategyKeys.all });
  };
}

export function useCreateStrategy() {
  const invalidate = useInvalidateStrategyLibrary();
  return useMutation<StrategyLibraryItem, Error, CreateStrategyInput>({
    mutationFn: (input) => createStrategy(input),
    onSuccess: invalidate,
  });
}

export function useUpdateStrategy() {
  const invalidate = useInvalidateStrategyLibrary();
  return useMutation<StrategyLibraryItem, Error, { id: string; input: UpdateStrategyInput }>({
    mutationFn: ({ id, input }) => updateStrategy(id, input),
    onSuccess: invalidate,
  });
}

export function useRenameStrategy() {
  const invalidate = useInvalidateStrategyLibrary();
  return useMutation<StrategyLibraryItem, Error, { id: string; input: RenameStrategyInput }>({
    mutationFn: ({ id, input }) => renameStrategy(id, input),
    onSuccess: invalidate,
  });
}

export function useDuplicateStrategy() {
  const invalidate = useInvalidateStrategyLibrary();
  return useMutation<StrategyLibraryItem, Error, string>({
    mutationFn: (id) => duplicateStrategy(id),
    onSuccess: invalidate,
  });
}

export function useDeleteStrategy() {
  const invalidate = useInvalidateStrategyLibrary();
  return useMutation<{ deletedId: string }, Error, string>({
    mutationFn: (id) => deleteStrategy(id),
    onSuccess: invalidate,
  });
}

export function useRestoreStrategy() {
  const invalidate = useInvalidateStrategyLibrary();
  return useMutation<StrategyLibraryItem, Error, string>({
    mutationFn: (id) => restoreStrategy(id),
    onSuccess: invalidate,
  });
}

function formatClockTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Keeps the browser draft in step with the Strategy Engine form. While the form is enabled and
 * differs from the baseline, each change stores the draft; otherwise the stored draft is removed.
 * Blocked or full browser storage leaves the page working without draft recovery.
 */
export function useStrategyDraftSync({
  current,
  baseline,
  enabled,
}: {
  current: Omit<StrategyDraftSnapshot, 'savedAt'>;
  baseline: Omit<StrategyDraftSnapshot, 'savedAt'>;
  enabled: boolean;
}) {
  const currentKey = JSON.stringify(current);
  const baselineKey = JSON.stringify(baseline);
  useEffect(() => {
    const currentDraft = JSON.parse(currentKey) as Omit<StrategyDraftSnapshot, 'savedAt'>;
    const baselineDraft = JSON.parse(baselineKey) as Omit<StrategyDraftSnapshot, 'savedAt'>;
    try {
      if (enabled && isStrategyDraftDirty(currentDraft, baselineDraft)) {
        writeStrategyDraft(window.localStorage, {
          ...currentDraft,
          savedAt: formatClockTime(new Date()),
        });
        return;
      }
      clearStrategyDraft(window.localStorage);
    } catch {
      // The draft is a convenience. A blocked or full storage must not stop the page.
    }
  }, [currentKey, baselineKey, enabled]);
}
