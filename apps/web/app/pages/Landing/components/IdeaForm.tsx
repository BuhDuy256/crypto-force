import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Field, FieldLabel } from '~/components/ui/field';
import { Textarea } from '~/components/ui/textarea';

const examples = [
  'MA20 crosses above MA50',
  'RSI below 30 and price under lower Bollinger Band',
  'Majority vote of MA, RSI and support/resistance',
];

export function IdeaForm() {
  const [idea, setIdea] = useState('');

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5">
      <Field>
        <FieldLabel htmlFor="idea" className="font-bold">
          Describe a strategy
        </FieldLabel>
        <Textarea
          id="idea"
          rows={3}
          value={idea}
          onChange={(event) => {
            setIdea(event.target.value);
          }}
          placeholder="e.g. Buy when MA20 crosses above MA50, sell when RSI goes above 70"
          className="min-h-21 resize-y bg-muted text-[15px] leading-normal"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            className="h-9 rounded-full bg-background px-3 text-[13px] font-normal whitespace-normal"
            onClick={() => {
              setIdea(example);
            }}
          >
            {example}
          </Button>
        ))}
      </div>
      <Button asChild className="h-12 self-start px-6 text-base font-bold no-underline">
        <Link to="/sign-up">
          Backtest this idea
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  );
}
