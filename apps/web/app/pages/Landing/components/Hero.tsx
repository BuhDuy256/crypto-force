import { cn } from '~/utils/cn';
import { sectionContainer } from '../sections';
import { BacktestPreview } from './BacktestPreview';
import { IdeaForm } from './IdeaForm';

const facts = [
  ['Pairs', 'BTCUSDT, ETHUSDT, SOLUSDT (examples)'],
  ['Timeframes', '1m, 5m, 15m, 1h, 4h'],
  ['History', 'Select a start and end date'],
  ['Data', 'Binance public API and WebSocket'],
] as const;

export function Hero() {
  return (
    <section className={cn(sectionContainer, 'pt-8 pb-9 sm:pt-11 sm:pb-14')}>
      <h1 className="m-0 max-w-[13ch] text-[32px] leading-[1.18] font-semibold tracking-[-0.04em] text-balance lg:text-[clamp(44px,7vw,76px)] lg:leading-[0.98]">
        Test the idea before you trade it.
      </h1>
      <div className="mt-7 flex flex-wrap items-start gap-7 lg:mt-9 lg:gap-10">
        <div className="flex min-w-0 flex-[1_1_100%] flex-col gap-5 lg:flex-[1_1_380px]">
          <p className="m-0 max-w-[34ch] text-xl leading-normal">
            Describe a trading idea in natural language. Review the generated strategy rules, test
            them on historical market data, and compare the return{' '}
            <strong>with the maximum drawdown</strong>.
          </p>
          <IdeaForm />
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {facts.map(([term, detail]) => (
              <div key={term} className="contents">
                <dt className="text-muted-foreground">{term}</dt>
                <dd className="m-0">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div
          id="product"
          className="flex min-w-0 flex-[1_1_100%] flex-col gap-3 overflow-hidden lg:flex-[1.45_1_560px] lg:overflow-visible"
        >
          <BacktestPreview />
        </div>
      </div>
    </section>
  );
}
