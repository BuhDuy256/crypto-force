import { useState, type ReactNode } from 'react';
import {
  backtestTimeframeSchema,
  createBacktestInputSchema,
  marketPairSchema,
  type CreateBacktestInput,
  type StrategyLibraryItem,
} from '@crypto-force/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { InfoTip } from './InfoTip';
import { formatBacktestPeriod, isDateAfterToday } from '~/utils/strategy-draft';

export interface BacktestFormValues {
  pair: z.infer<typeof marketPairSchema>;
  timeframe: z.infer<typeof backtestTimeframeSchema>;
  from: string;
  to: string;
  capitalUsd: number;
  strategyName: string;
  strategyId: string | null;
  feePercent: number;
  slippageBps: number;
  unsavedRules?: string[] | undefined;
}

export interface UnsavedStrategy {
  name: string;
  rules: string[];
}

const MA_CROSSOVER = 'MA Crossover';

const selectClass =
  'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30';

function localTodayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${String(now.getFullYear())}-${month}-${day}`;
}

function createBacktestFormSchema(todayIsoDate: string) {
  return z
    .object({
      pair: marketPairSchema,
      timeframe: backtestTimeframeSchema,
      from: z.string().min(1, 'Pick a start date.'),
      to: z.string().min(1, 'Pick an end date.'),
      capitalUsd: z.number({ error: 'Enter at least 1 USD.' }).min(1, 'Enter at least 1 USD.'),
      strategyName: z.string().min(1, 'Choose a strategy.'),
      strategyId: z.string().nullable(),
      feePercent: z.number({ error: 'Use 0 to 1%.' }).min(0, 'Use 0 to 1%.').max(1, 'Use 0 to 1%.'),
      slippageBps: z
        .number({ error: 'Whole number, 0 to 100.' })
        .int('Whole number, 0 to 100.')
        .min(0, 'Whole number, 0 to 100.')
        .max(100, 'Whole number, 0 to 100.'),
      unsavedRules: z.array(z.string().min(1)).optional(),
    })
    .refine((value) => value.to > value.from, {
      path: ['to'],
      message: 'End date must be after the start date.',
    })
    .superRefine((value, context) => {
      if (value.to !== '' && isDateAfterToday(value.to, todayIsoDate)) {
        context.addIssue({
          code: 'custom',
          path: ['to'],
          message: 'End date cannot be in the future.',
        });
      }
    });
}

/** Creates the Backtest form with the shared date and numeric rules. */
export function useBacktestForm(defaultValues: BacktestFormValues) {
  const [resolver] = useState(() => zodResolver(createBacktestFormSchema(localTodayIsoDate())));
  return useForm<BacktestFormValues>({ resolver, defaultValues });
}

/** Removes the hidden unsaved rules when they do not belong to the selected strategy. */
export function toCreateBacktestInput(values: BacktestFormValues): CreateBacktestInput {
  const input: CreateBacktestInput = {
    pair: values.pair,
    timeframe: values.timeframe,
    from: values.from,
    to: values.to,
    capitalUsd: values.capitalUsd,
    strategyName: values.strategyName,
    strategyId: values.strategyId,
    feePercent: values.feePercent,
    slippageBps: values.slippageBps,
  };
  if (values.unsavedRules === undefined) return input;
  return { ...input, unsavedRules: values.unsavedRules };
}

function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (message === undefined) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
  explanation,
  tipAlign = 'start',
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
  explanation?: string;
  tipAlign?: 'start' | 'end';
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <div className="flex h-5 items-center gap-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {explanation === undefined ? null : (
          <InfoTip label={label} explanation={explanation} align={tipAlign} />
        )}
      </div>
      {children}
    </div>
  );
}

interface StrategyOption {
  key: string;
  name: string;
  strategyId: string | null;
  label: string;
  rules: string[] | undefined;
}

interface BacktestSetupFormProps {
  form: UseFormReturn<BacktestFormValues>;
  strategies: StrategyLibraryItem[];
  unsavedStrategy: UnsavedStrategy | null;
  note: string | null;
  isStarting: boolean;
  onSubmit: (input: CreateBacktestInput) => void;
  onStrategyChange?: () => void;
}

export function BacktestSetupForm({
  form,
  strategies,
  unsavedStrategy,
  note,
  isStarting,
  onSubmit,
  onStrategyChange,
}: BacktestSetupFormProps) {
  const { errors } = form.formState;
  const strategyName = useWatch({ control: form.control, name: 'strategyName' });
  const strategyId = useWatch({ control: form.control, name: 'strategyId' });
  const from = useWatch({ control: form.control, name: 'from' });
  const to = useWatch({ control: form.control, name: 'to' });

  const options: StrategyOption[] = [
    {
      key: 'builtin',
      name: MA_CROSSOVER,
      strategyId: null,
      label: 'MA Crossover (built-in)',
      rules: undefined,
    },
    ...strategies.map((item) => ({
      key: `library:${item.id}`,
      name: item.name,
      strategyId: item.id,
      label: item.kind === 'composite' ? `${item.name} · composite` : item.name,
      rules: undefined,
    })),
    ...(unsavedStrategy === null
      ? []
      : [
          {
            key: 'unsaved',
            name: unsavedStrategy.name,
            strategyId: null,
            label: `${unsavedStrategy.name} (unsaved)`,
            rules: unsavedStrategy.rules,
          },
        ]),
  ];

  const isUnsavedSelected =
    unsavedStrategy !== null &&
    strategyId === null &&
    strategyName !== MA_CROSSOVER &&
    strategyName === unsavedStrategy.name;
  const selectedKey =
    strategyId === null ? (isUnsavedSelected ? 'unsaved' : 'builtin') : `library:${strategyId}`;

  const fieldErrorCount = Object.keys(errors).filter((key) => key !== 'root').length;
  const period = formatBacktestPeriod(from, to);
  const showPeriod = period !== null && errors.from === undefined && errors.to === undefined;
  const todayIsoDate = localTodayIsoDate();

  function chooseStrategy(key: string): void {
    const option = options.find((entry) => entry.key === key);
    if (option === undefined) return;
    form.setValue('strategyName', option.name, { shouldValidate: true, shouldDirty: true });
    form.setValue('strategyId', option.strategyId, { shouldValidate: true, shouldDirty: true });
    form.setValue('unsavedRules', option.rules, { shouldDirty: true });
    onStrategyChange?.();
  }

  const submit = form.handleSubmit((values) => {
    const parsed = createBacktestInputSchema.safeParse(toCreateBacktestInput(values));
    if (!parsed.success) {
      form.setError('root', { message: 'Check the backtest setup and try again.' });
      return;
    }
    onSubmit(parsed.data);
  });

  return (
    <form
      aria-label="Backtest setup"
      noValidate
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <Field label="Pair" htmlFor="backtest-pair" className="flex-[1.2_1_130px]">
          <select
            id="backtest-pair"
            className={selectClass}
            aria-invalid={errors.pair === undefined ? undefined : true}
            {...form.register('pair')}
          >
            {marketPairSchema.options.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
          <FieldError id="backtest-pair-error" message={errors.pair?.message} />
        </Field>

        <Field label="Timeframe" htmlFor="backtest-timeframe" className="flex-[0.7_1_90px]">
          <select
            id="backtest-timeframe"
            className={selectClass}
            aria-invalid={errors.timeframe === undefined ? undefined : true}
            {...form.register('timeframe')}
          >
            {backtestTimeframeSchema.options.map((timeframe) => (
              <option key={timeframe} value={timeframe}>
                {timeframe}
              </option>
            ))}
          </select>
          <FieldError id="backtest-timeframe-error" message={errors.timeframe?.message} />
        </Field>

        <Field label="From" htmlFor="backtest-from" className="flex-[1_1_150px]">
          <Input
            id="backtest-from"
            type="date"
            max={todayIsoDate}
            aria-invalid={errors.from === undefined ? undefined : true}
            aria-describedby={errors.from === undefined ? undefined : 'backtest-from-error'}
            {...form.register('from')}
          />
          <FieldError id="backtest-from-error" message={errors.from?.message} />
        </Field>

        <Field label="To" htmlFor="backtest-to" className="flex-[1_1_150px]">
          <Input
            id="backtest-to"
            type="date"
            max={todayIsoDate}
            aria-invalid={errors.to === undefined ? undefined : true}
            aria-describedby={errors.to === undefined ? undefined : 'backtest-to-error'}
            {...form.register('to')}
          />
          <FieldError id="backtest-to-error" message={errors.to?.message} />
        </Field>

        <Field label="Capital (USD)" htmlFor="backtest-capital" className="flex-[0.9_1_110px]">
          <Input
            id="backtest-capital"
            type="number"
            inputMode="decimal"
            min={1}
            step={1}
            aria-invalid={errors.capitalUsd === undefined ? undefined : true}
            aria-describedby={
              errors.capitalUsd === undefined ? undefined : 'backtest-capital-error'
            }
            {...form.register('capitalUsd', { valueAsNumber: true })}
          />
          <FieldError id="backtest-capital-error" message={errors.capitalUsd?.message} />
        </Field>

        <Field label="Strategy" htmlFor="backtest-strategy" className="flex-[1.6_1_180px]">
          <Controller
            control={form.control}
            name="strategyName"
            render={({ field }) => (
              <select
                id="backtest-strategy"
                className={selectClass}
                ref={field.ref}
                value={selectedKey}
                aria-invalid={errors.strategyName === undefined ? undefined : true}
                aria-describedby={
                  errors.strategyName === undefined ? undefined : 'backtest-strategy-error'
                }
                onBlur={field.onBlur}
                onChange={(event) => {
                  chooseStrategy(event.target.value);
                }}
              >
                {options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          <FieldError id="backtest-strategy-error" message={errors.strategyName?.message} />
        </Field>

        <Field
          label="Fee (%)"
          explanation="Exchange trading fee charged on each entry and exit, as a percent of the trade size."
          htmlFor="backtest-fee"
          className="flex-[0.8_1_110px]"
        >
          <Input
            id="backtest-fee"
            type="number"
            inputMode="decimal"
            min={0}
            max={1}
            step={0.01}
            aria-invalid={errors.feePercent === undefined ? undefined : true}
            aria-describedby={errors.feePercent === undefined ? undefined : 'backtest-fee-error'}
            {...form.register('feePercent', { valueAsNumber: true })}
          />
          <FieldError id="backtest-fee-error" message={errors.feePercent?.message} />
        </Field>

        <Field
          label="Slippage (bps)"
          explanation="Expected gap between the signal price and the price you actually get. 1 bps = 0.01%."
          htmlFor="backtest-slippage"
          tipAlign="end"
          className="flex-[0.8_1_120px]"
        >
          <Input
            id="backtest-slippage"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            aria-invalid={errors.slippageBps === undefined ? undefined : true}
            aria-describedby={
              errors.slippageBps === undefined ? undefined : 'backtest-slippage-error'
            }
            {...form.register('slippageBps', { valueAsNumber: true })}
          />
          <FieldError id="backtest-slippage-error" message={errors.slippageBps?.message} />
        </Field>
      </div>

      {showPeriod ? (
        <p className="text-sm text-muted-foreground">
          Period: <span className="text-foreground">{period}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {note === null ? null : (
          <span role="status" className="text-sm text-info">
            {note}
          </span>
        )}
        {fieldErrorCount > 0 ? (
          <span role="alert" className="text-sm text-destructive">
            Fix {fieldErrorCount} field(s) above to run the backtest.
          </span>
        ) : null}
        {errors.root?.message === undefined ? null : (
          <span role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </span>
        )}
        <Button
          type="submit"
          className="ml-auto min-w-40"
          disabled={isStarting || fieldErrorCount > 0}
        >
          {isStarting ? 'Starting…' : 'Run backtest'}
        </Button>
      </div>
    </form>
  );
}
