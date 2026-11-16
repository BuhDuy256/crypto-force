import { cn } from '~/utils/cn';
import { sectionContainer, sectionHeading } from '../sections';

const steps = [
  {
    name: 'Market',
    question: 'How has price moved?',
    answer: 'Up to four candlestick charts of one pair, each on its own timeframe, updating live.',
  },
  {
    name: 'Strategy',
    question: 'When do I buy or sell?',
    answer:
      'Rules based on indicators (MA, RSI, Bollinger, support/resistance, SMC, Wyckoff), described in natural language or referenced by a link, and combined by majority or weighted vote.',
  },
  {
    name: 'Backtest',
    question: 'How would the rule have traded?',
    answer:
      'Every simulated trade over the period you pick, with entries and exits on the chart, fees and slippage included.',
  },
  {
    name: 'Evaluation',
    question: 'Is it good, or just risky?',
    answer: 'Total return, win rate, max drawdown and number of trades, side by side.',
  },
  {
    name: 'Leaderboard',
    question: 'Which one is better?',
    answer:
      'Results ranked by return, win rate, drawdown or a combined score, keeping the top few.',
  },
  {
    name: 'Discovery',
    question: 'What should I try next?',
    answer:
      'Automatic search that generates, tests and ranks variants until your stop condition, with a status you can pause and resume.',
  },
  {
    name: 'News',
    question: 'What else is going on?',
    answer:
      'News per coin, scored positive, neutral or negative, usable as an input only when a rule asks for it.',
  },
];

export function HowItWorks() {
  return (
    <section id="loop" className={cn(sectionContainer, 'py-8 sm:py-14')}>
      <h2 className={cn(sectionHeading, 'mb-2')}>One loop, from chart to candidate.</h2>
      <p className="m-0 mb-6 max-w-[60ch] text-[17px] leading-[1.55] text-secondary-foreground/80">
        Each step answers the question the last one raised. Discovery keeps the loop running for you
        and hands back the strategies worth a closer look.
      </p>
      <div tabIndex={0} role="region" aria-label="How the loop works" className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-y border-input/40 text-left text-[13px] text-muted-foreground">
              <th className="w-[18%] py-3 font-semibold">Step</th>
              <th className="w-[32%] font-semibold">The question</th>
              <th className="font-semibold">What you get</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <tr key={step.name} className="border-b align-top">
                <td className="py-4 text-[17px] font-semibold">{step.name}</td>
                <td className="py-4 pr-5 text-base">{step.question}</td>
                <td className="py-4 text-[15px] leading-normal text-secondary-foreground/80">
                  {step.answer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
