import type { JSX } from 'react';
import type { BacktestTrade, BacktestTradeSide } from '@crypto-force/shared';
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/utils/cn';

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const PAGE_SIZES = [10, 25, 50] as const;

const LEFT_ALIGNED_COLUMNS = new Set(['index', 'openedAt', 'side']);

const usd = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function signed(value: number, body: string): string {
  if (value > 0) return `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}

function formatUsd(value: number): string {
  return signed(value, usd.format(Math.abs(value)));
}

function formatPercent(value: number): string {
  return signed(value, `${percent.format(Math.abs(value))}%`);
}

function formatPrice(value: number): string {
  return usd.format(value);
}

/** Page buttons in the order the prototype shows them, for example 1 2 3 … 18. */
function pageItems(current: number, last: number): Array<number | 'gap'> {
  if (last <= 5) return Array.from({ length: last }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 'gap', last];
  if (current >= last - 2) return [1, 'gap', last - 2, last - 1, last];
  return [1, 'gap', current, 'gap', last];
}

function pnlColor(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-destructive';
  return 'text-foreground';
}

function SideLabel({ side }: { side: BacktestTradeSide }) {
  const long = side === 'LONG';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold',
        long ? 'text-success' : 'text-destructive',
      )}
    >
      {long ? (
        <ArrowUp aria-hidden="true" className="size-3" />
      ) : (
        <ArrowDown aria-hidden="true" className="size-3" />
      )}
      {side}
    </span>
  );
}

const helper = createColumnHelper<typeof features, BacktestTrade>();

const columns = helper.columns([
  helper.accessor('index', {
    header: '#',
    cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
  }),
  helper.accessor('openedAt', { header: 'Opened' }),
  helper.accessor('side', {
    header: 'Side',
    cell: (info) => <SideLabel side={info.getValue()} />,
  }),
  helper.accessor('pnlUsd', {
    header: 'P/L (USD)',
    cell: (info) => (
      <span className={cn('font-semibold', pnlColor(info.getValue()))}>
        {formatUsd(info.getValue())}
      </span>
    ),
  }),
  helper.accessor('pnlPercent', {
    header: 'P/L %',
    cell: (info) => (
      <span className={pnlColor(info.getValue())}>{formatPercent(info.getValue())}</span>
    ),
  }),
  helper.accessor('entryPrice', {
    header: 'Entry',
    cell: (info) => formatPrice(info.getValue()),
  }),
  helper.accessor('exitPrice', {
    header: 'Exit',
    cell: (info) => formatPrice(info.getValue()),
  }),
  helper.accessor('stopLoss', {
    header: 'Stop loss',
    cell: (info) => formatPrice(info.getValue()),
  }),
  helper.accessor('takeProfit', {
    header: 'Take profit',
    cell: (info) => formatPrice(info.getValue()),
  }),
  helper.accessor('feeUsd', {
    header: 'Fee',
    cell: (info) => <span className="text-muted-foreground">{formatUsd(-info.getValue())}</span>,
  }),
  helper.accessor('slippageUsd', {
    header: 'Slippage',
    cell: (info) => <span className="text-muted-foreground">{formatUsd(-info.getValue())}</span>,
  }),
  helper.accessor('heldDuration', {
    header: 'Held',
    cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
  }),
]);

function MobileCard({ trade }: { trade: BacktestTrade }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">#{trade.index}</span>
        <span className="text-muted-foreground">{trade.openedAt}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <SideLabel side={trade.side} />
        <span className={cn('font-semibold', pnlColor(trade.pnlUsd))}>
          {formatUsd(trade.pnlUsd)}
        </span>
        <span className={pnlColor(trade.pnlPercent)}>{formatPercent(trade.pnlPercent)}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Entry</dt>
          <dd>{formatPrice(trade.entryPrice)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Exit</dt>
          <dd>{formatPrice(trade.exitPrice)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Stop loss</dt>
          <dd>{formatPrice(trade.stopLoss)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Take profit</dt>
          <dd>{formatPrice(trade.takeProfit)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Fee</dt>
          <dd className="text-muted-foreground">{formatUsd(-trade.feeUsd)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Slippage</dt>
          <dd className="text-muted-foreground">{formatUsd(-trade.slippageUsd)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Held</dt>
          <dd className="text-muted-foreground">{trade.heldDuration}</dd>
        </div>
      </dl>
    </li>
  );
}

export function BacktestTradesTable({ trades }: { trades: BacktestTrade[] }): JSX.Element {
  const table = useTable({
    features,
    columns,
    data: trades,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const pagination = table.state.pagination;
  const total = trades.length;
  const start = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);
  const rows = table.getRowModel().rows;

  return (
    <section
      aria-labelledby="backtest-trades-heading"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 id="backtest-trades-heading" className="text-base font-semibold">
          Trades
        </h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {total === 0 ? '0 of 0' : `${String(start)}–${String(end)} of ${String(total)}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="hidden w-full min-w-[900px] border-collapse text-sm sm:table">
          <thead>
            <tr className="border-b text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const alignRight = !LEFT_ALIGNED_COLUMNS.has(header.column.id);
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                      }
                      className={cn(
                        'px-2 py-2 font-semibold first:pl-0 last:pr-0',
                        alignRight ? 'text-right' : 'text-left',
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp aria-hidden="true" className="size-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown aria-hidden="true" className="size-3" />
                          ) : null}
                        </button>
                      )}
                    </th>
                  );
                }),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                  No trades in this run.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-2 py-2 first:pl-0 last:pr-0',
                        LEFT_ALIGNED_COLUMNS.has(cell.column.id) ? 'text-left' : 'text-right',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <ul className="flex flex-col gap-2 sm:hidden">
          {rows.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">
              No trades in this run.
            </li>
          ) : (
            rows.map((row) => <MobileCard key={row.id} trade={row.original} />)
          )}
        </ul>
      </div>

      <nav
        aria-label="Trade pages"
        className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm"
      >
        <label className="mr-auto flex items-center gap-2">
          Rows
          <select
            aria-label="Rows per page"
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            value={pagination.pageSize}
            onChange={(event) => {
              table.setPageSize(Number(event.target.value));
              table.setPageIndex(0);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={!table.getCanPreviousPage()}
          onClick={() => {
            table.previousPage();
          }}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        {pageItems(pagination.pageIndex + 1, Math.max(1, table.getPageCount())).map(
          (item, position) =>
            item === 'gap' ? (
              <span
                key={`gap-${String(position)}`}
                aria-hidden="true"
                className="px-1 text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={item === pagination.pageIndex + 1 ? 'default' : 'ghost'}
                aria-label={`Page ${String(item)}`}
                aria-current={item === pagination.pageIndex + 1 ? 'page' : undefined}
                className="min-w-8 px-2"
                onClick={() => {
                  table.setPageIndex(item - 1);
                }}
              >
                {item}
              </Button>
            ),
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={!table.getCanNextPage()}
          onClick={() => {
            table.nextPage();
          }}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </nav>
    </section>
  );
}
