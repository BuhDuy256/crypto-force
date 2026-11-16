import { Link } from 'react-router';
import { Logo } from '~/components/Logo';
import { useIsSignedIn } from '~/hooks/useAuth';
import { cn } from '~/utils/cn';
import { sectionContainer, WORKSPACE_HOME } from '../sections';

const footerLink = 'text-foreground no-underline hover:underline';

export function LandingFooter() {
  const signedIn = useIsSignedIn();
  return (
    <footer className="border-t">
      <div className={cn(sectionContainer, 'flex flex-wrap gap-x-12 gap-y-8 pt-10 pb-7')}>
        <div className="flex flex-[1.4_1_260px] flex-col gap-3">
          <Logo />
          <p className="m-0 max-w-[36ch] text-sm leading-[1.55] text-muted-foreground">
            Strategy research for crypto traders. Analysis and simulation only; Crypto Force never
            places orders.
          </p>
        </div>
        <nav aria-label="Product" className="flex flex-[1_1_150px] flex-col gap-1 text-sm">
          <h2 className="m-0 mb-1 text-[17px] font-semibold">Product</h2>
          <a href="#product" className={footerLink}>
            Backtest
          </a>
          <a href="#loop" className={footerLink}>
            How it works
          </a>
          <a href="#evidence" className={footerLink}>
            Return vs. risk
          </a>
          {signedIn ? (
            <Link to={WORKSPACE_HOME} className={footerLink}>
              Open workspace
            </Link>
          ) : (
            <Link to="/sign-up" className={footerLink}>
              Create account
            </Link>
          )}
        </nav>
        <nav aria-label="Resources" className="flex flex-[1_1_150px] flex-col gap-1 text-sm">
          <h2 className="m-0 mb-1 text-[17px] font-semibold">Resources</h2>
          <a href="#faq" className={footerLink}>
            FAQ
          </a>
        </nav>
      </div>
      <div
        className={cn(
          sectionContainer,
          'flex flex-wrap gap-x-6 gap-y-3 border-t pt-5 pb-7 text-[13px] leading-[1.55] text-muted-foreground',
        )}
      >
        <span>© Crypto Force</span>
        <span>Market data: Binance API + WebSocket</span>
        <p className="m-0 max-w-[110ch] flex-[1_1_100%]">
          Crypto Force is a research tool, not financial advice. Backtests use historical data and
          simulated fills; real trading results will differ. Crypto assets are volatile and you can
          lose money.
        </p>
      </div>
    </footer>
  );
}
