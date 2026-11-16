import { cn } from '~/utils/cn';
import { sectionContainer, sectionHeading } from '../sections';

export function ReturnVsRisk() {
  return (
    <section id="evidence" className="border-t border-b bg-secondary">
      <div className={cn(sectionContainer, 'flex flex-wrap gap-10 py-8 sm:py-12')}>
        <div className="flex flex-[1_1_320px] flex-col gap-4">
          <h2 className={sectionHeading}>Higher return isn’t always better.</h2>
          <p className="m-0 max-w-[40ch] text-[17px] leading-[1.55]">
            Two illustrative strategies each start with 100 units. A ends higher but experiences a
            much deeper drawdown. B earns slightly less with a smaller drawdown. Compare both
            metrics when assessing a result.
          </p>
          <table className="mt-2 border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-input/40 text-right text-[13px] text-muted-foreground">
                <th className="py-2 pr-5 text-left font-semibold">Strategy</th>
                <th className="pr-5 font-semibold">Return</th>
                <th className="pr-5 font-semibold">Max DD</th>
                <th className="text-left font-semibold">Drawdown example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-5 font-bold">A</td>
                <td className="pr-5 text-right font-bold text-success">+30%</td>
                <td className="pr-5 text-right font-bold text-destructive">−45%</td>
                <td className="text-sm leading-snug">Down to 69 from 125 before recovering</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-5 font-bold">B</td>
                <td className="pr-5 text-right font-bold text-success">+25%</td>
                <td className="pr-5 text-right font-bold text-destructive">−8%</td>
                <td className="text-sm leading-snug">Never further than 112 → 103</td>
              </tr>
            </tbody>
          </table>
        </div>
        <figure className="m-0 min-w-0 flex-[1.4_1_520px]">
          <figcaption className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 text-sm">
            <strong className="mr-auto text-base font-semibold">
              Illustrative account value, T1–T7
            </strong>
            <span className="flex items-center gap-2">
              <span className="w-[18px] border-t-[3px] border-foreground" />A
            </span>
            <span className="flex items-center gap-2">
              <span className="w-[18px] border-t-[3px] border-dashed border-info" />B
            </span>
          </figcaption>
          <div className="mt-4 flex gap-3">
            <div className="flex h-60 w-[30px] flex-col justify-between text-right text-xs text-muted-foreground">
              <span>140</span>
              <span>120</span>
              <span>100</span>
              <span>80</span>
              <span>60</span>
            </div>
            <div className="relative h-60 flex-1">
              <div className="absolute inset-0 flex flex-col justify-between">
                <span className="border-t" />
                <span className="border-t" />
                <span className="border-t border-input/40" />
                <span className="border-t" />
                <span className="border-t" />
              </div>
              <svg
                viewBox="0 0 600 240"
                preserveAspectRatio="none"
                role="img"
                aria-label="Strategy A rises to 125, falls to 69, ends at 130. Strategy B rises steadily to 125 with a small dip to 103."
                className="absolute inset-0 size-full overflow-visible"
              >
                <rect x="200" y="0" width="200" height="240" className="fill-destructive/8" />
                <polyline
                  points="0,120 100,75 200,45 300,150 400,213 500,135 600,30"
                  fill="none"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-foreground"
                />
                <polyline
                  points="0,120 100,102 200,84 300,111 400,90 500,66 600,45"
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-info"
                />
              </svg>
              <span className="absolute top-1 left-1/2 -translate-x-1/2 bg-secondary px-2 text-[13px] font-bold whitespace-nowrap text-destructive">
                A: −45% from peak
              </span>
            </div>
          </div>
          <div className="mt-2 flex justify-between pl-10 text-xs text-muted-foreground">
            <span>T1</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
          </div>
        </figure>
      </div>
    </section>
  );
}
