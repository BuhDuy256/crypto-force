import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { useIsSignedIn } from '~/hooks/useAuth';
import { cn } from '~/utils/cn';
import { sectionContainer, sectionHeading, WORKSPACE_HOME } from '../sections';

const limits = [
  ['It never places an order.', 'Everything is analysis and simulation on market data.'],
  [
    'It doesn’t promise profit.',
    'A top-ranked candidate only performs well under the selected test and ranking criteria; it is not a forecast.',
  ],
  [
    'It doesn’t hide costs.',
    'Review the fee, slippage and data assumptions behind each backtest before comparing results.',
  ],
] as const;

export function Limits() {
  const signedIn = useIsSignedIn();
  return (
    <section id="limits" className="border-y bg-card">
      <div
        className={cn(
          sectionContainer,
          'flex flex-wrap items-start gap-x-14 gap-y-9 py-8 sm:py-[52px]',
        )}
      >
        <h2 className={cn(sectionHeading, 'flex-[1_1_300px]')}>What Crypto Force won’t do.</h2>
        <ul className="m-0 flex flex-[2_1_520px] list-none flex-col p-0">
          {limits.map(([title, detail]) => (
            <li
              key={title}
              className="border-t border-input/40 py-4 text-[17px] leading-normal last:border-b"
            >
              <strong className="font-bold">{title}</strong> {detail}
            </li>
          ))}
        </ul>
        <div className="flex flex-[1_1_100%] flex-wrap items-center gap-4">
          {signedIn ? (
            <Button asChild className="h-[50px] px-6 text-base font-bold no-underline">
              <Link to={WORKSPACE_HOME}>Open workspace</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="h-[50px] px-6 text-base font-bold no-underline">
                <Link to="/sign-up">Create account</Link>
              </Button>
              <Link
                to="/sign-in"
                className="inline-flex min-h-11 items-center text-[15px] font-semibold underline"
              >
                I already have an account
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
