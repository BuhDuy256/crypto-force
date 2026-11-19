import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { cn } from '~/utils/cn';
import { sectionContainer, sectionHeading } from '../sections';

const questions = [
  {
    question: 'Does Crypto Force place trades on my exchange account?',
    answer:
      'No. It never connects to an exchange account and never asks for API keys. Everything is analysis and simulation on market data.',
  },
  {
    question: 'Where does the data come from?',
    answer:
      'Price candles and ticks come from Binance through its public API and WebSocket. News comes from the sources you configure in the News tab.',
  },
  {
    question: 'How do I describe a strategy?',
    answer:
      'Describe the entry and exit rules in your own words, for example "buy when RSI is below 30 and price is under the lower Bollinger Band", or paste a link to a write-up. The Strategy Engine turns it into rules you can check before saving.',
  },
  {
    question: 'Can I trust a backtest result?',
    answer:
      'A backtest shows how a rule would have traded on past data with the fees and slippage you set. Read the return together with max drawdown and the number of trades; a good past result is not a forecast.',
  },
  {
    question: 'Can I reproduce a result later?',
    answer:
      'Reproducibility requires the same strategy version, data, execution assumptions and backtest settings. Compare those details when reviewing a run.',
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className={cn(sectionContainer, 'flex flex-wrap gap-x-14 gap-y-6 pt-2 pb-9 sm:pb-16')}
    >
      <h2 id="faq-heading" className={cn(sectionHeading, 'flex-[1_1_280px]')}>
        Questions
      </h2>
      <Accordion
        type="single"
        collapsible
        defaultValue="faq-0"
        className="min-w-0 flex-[2_1_560px] border-t border-input/40"
      >
        {questions.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`faq-${index}`}
            className="border-b border-input/40 last:border-b"
          >
            <AccordionTrigger className="min-h-[60px] items-center text-[17px] font-semibold hover:no-underline [&>svg]:size-[18px]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="max-w-[68ch] pb-5 text-base leading-relaxed text-secondary-foreground/80">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
