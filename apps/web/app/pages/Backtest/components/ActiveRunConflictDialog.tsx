import type { BacktestRun } from '@crypto-force/shared';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

interface ActiveRunConflictDialogProps {
  open: boolean;
  activeRun: BacktestRun | null;
  cancelling: boolean;
  onClose: () => void;
  onViewRunningRun: () => void;
  onCancelAndRun: () => void;
}

export function ActiveRunConflictDialog({
  open,
  activeRun,
  cancelling,
  onClose,
  onViewRunningRun,
  onCancelAndRun,
}: ActiveRunConflictDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !cancelling) onClose();
      }}
    >
      <DialogContent showCloseButton={!cancelling}>
        <DialogHeader>
          <DialogTitle>A backtest is already running</DialogTitle>
          <DialogDescription>
            {activeRun === null ? '' : `${activeRun.strategyName} (${activeRun.id}) is `}
            {activeRun === null ? '' : `${activeRun.progressPercent}% done. `}
            Only one manual backtest can run at a time. The settings you just entered are kept.
          </DialogDescription>
        </DialogHeader>

        {cancelling ? (
          <p role="status" className="text-sm text-info">
            Cancelling the running backtest. The new one starts as soon as it stops.
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={cancelling} onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="outline" disabled={cancelling} onClick={onViewRunningRun}>
            View running run
          </Button>
          <Button type="button" disabled={cancelling} onClick={onCancelAndRun}>
            {cancelling ? 'Cancelling…' : 'Cancel it and run the new one'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
