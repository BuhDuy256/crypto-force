import { z } from 'zod';

export const strategyKindSchema = z.enum(['strategy', 'composite']);
export const strategyInputModeSchema = z.enum(['prompt', 'url']);
export const strategySourceSchema = z.enum([
  'Written by you',
  'Imported from a link',
  'Built in Discovery',
]);

export const strategyValidationCheckSchema = z.strictObject({
  title: z.string().min(1),
  detail: z.string().min(1),
  passed: z.boolean(),
});

export const strategyPreviewRequestSchema = z.discriminatedUnion('inputMode', [
  z.strictObject({
    inputMode: z.literal('prompt'),
    prompt: z.string().trim().min(1).max(1000),
  }),
  z.strictObject({
    inputMode: z.literal('url'),
    url: z.string().regex(/^https?:\/\/[^\s/]+\.[^\s/]+/),
  }),
]);

export const strategyPreviewResponseSchema = z.strictObject({
  inputMode: strategyInputModeSchema,
  source: strategySourceSchema,
  rules: z.array(z.string().min(1)).min(1),
  hasShortExample: z.boolean(),
  shortRuleText: z.string().min(1),
  riskSummary: z.string().min(1),
  assumedTimeframe: z.string().min(1),
  assumedPairs: z.string().min(1),
  assumptions: z.array(z.string().min(1)),
  definitionJson: z.string().min(2),
  checks: z.array(strategyValidationCheckSchema).min(1),
  suggestedName: z.string().trim().min(1).max(60),
  suggestedTags: z.array(z.string().trim().min(1).max(32)),
});

export const strategyLibraryItemSchema = z.strictObject({
  id: z.string().min(1),
  kind: strategyKindSchema,
  name: z.string().trim().min(1).max(60),
  source: strategySourceSchema,
  inputMode: strategyInputModeSchema.nullable(),
  prompt: z.string().nullable(),
  url: z.string().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  rules: z.array(z.string().min(1)).min(1),
  blocks: z.array(z.string().min(1)).nullable(),
  voteMethod: z.enum(['majority', 'weighted']).nullable(),
  weights: z.array(z.number().nonnegative()).nullable(),
  lastRunSummary: z.string().nullable(),
});

const strategyInputShape = {
  name: z.string().trim().min(1).max(60),
  inputMode: strategyInputModeSchema,
  prompt: z.string().nullable(),
  url: z.string().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)),
  includeShortExample: z.boolean(),
  rules: z.array(z.string().min(1)).min(1),
};

export const createStrategyInputSchema = z.strictObject(strategyInputShape);
export const updateStrategyInputSchema = z.strictObject(strategyInputShape);

export const renameStrategyInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(60),
});

export const strategyListResponseSchema = z.strictObject({
  items: z.array(strategyLibraryItemSchema),
  totalCount: z.number().int().nonnegative(),
});

export type StrategyKind = z.infer<typeof strategyKindSchema>;
export type StrategyInputMode = z.infer<typeof strategyInputModeSchema>;
export type StrategySource = z.infer<typeof strategySourceSchema>;
export type StrategyValidationCheck = z.infer<typeof strategyValidationCheckSchema>;
export type StrategyPreviewRequest = z.infer<typeof strategyPreviewRequestSchema>;
export type StrategyPreviewResponse = z.infer<typeof strategyPreviewResponseSchema>;
export type StrategyLibraryItem = z.infer<typeof strategyLibraryItemSchema>;
export type StrategyListResponse = z.infer<typeof strategyListResponseSchema>;
export type CreateStrategyInput = z.infer<typeof createStrategyInputSchema>;
export type UpdateStrategyInput = z.infer<typeof updateStrategyInputSchema>;
export type RenameStrategyInput = z.infer<typeof renameStrategyInputSchema>;
