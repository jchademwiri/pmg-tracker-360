import { formatCurrency } from '@/lib/format';
import {
  AGEING_BUCKETS,
  type StatementAgeingSummary,
  hasStatementAgeingBalance,
} from '@/lib/statements/ageing';
import { cn } from '@/lib/utils';

const AGEING_LABELS: Record<(typeof AGEING_BUCKETS)[number], string> = {
  current: 'Current',
  days1To30: '1-30 Days',
  days31To60: '31-60 Days',
  days61To90: '61-90 Days',
  days90Plus: '90+ Days',
};

type AgeingSummaryTableProps = {
  summary: StatementAgeingSummary;
  className?: string;
  hideWhenEmpty?: boolean;
};

function formatStatementAmount(amount: number) {
  return formatCurrency(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AgeingSummaryTable({
  summary,
  className,
  hideWhenEmpty = true,
}: AgeingSummaryTableProps) {
  if (hideWhenEmpty && !hasStatementAgeingBalance(summary)) {
    return null;
  }

  return (
    <section className={cn('space-y-2', className)} aria-labelledby="ageing-summary-heading">
      <div>
        <h2 id="ageing-summary-heading" className="text-sm font-semibold text-foreground">
          Ageing Summary
        </h2>
        <p className="text-xs text-muted-foreground">
          Outstanding balances grouped by invoice due date.
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground">
              {AGEING_BUCKETS.map((bucket) => (
                <th key={bucket} className="whitespace-nowrap p-2 text-right font-medium">
                  {AGEING_LABELS[bucket]}
                </th>
              ))}
              <th className="whitespace-nowrap p-2 text-right font-semibold text-foreground">
                Total Due
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {AGEING_BUCKETS.map((bucket) => (
                <td key={bucket} className="whitespace-nowrap p-2 text-right tabular-nums">
                  {formatStatementAmount(summary[bucket])}
                </td>
              ))}
              <td className="whitespace-nowrap p-2 text-right font-semibold tabular-nums">
                {formatStatementAmount(summary.totalDue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
