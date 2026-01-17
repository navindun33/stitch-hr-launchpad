import { ArrowRight, Wallet } from "lucide-react";

interface YTDSummaryCardProps {
  fiscalYear: string;
  totalNetEarnings: string;
  totalDeductions: string;
  grossPay: string;
  progressPercentage: number;
  onViewBreakdown?: () => void;
}

export function YTDSummaryCard({
  fiscalYear,
  totalNetEarnings,
  totalDeductions,
  grossPay,
  progressPercentage,
  onViewBreakdown,
}: YTDSummaryCardProps) {
  return (
    <div className="bg-card rounded-xl card-shadow-lg overflow-hidden border border-card">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-primary font-bold text-xs uppercase tracking-wider mb-1">
              {fiscalYear} Fiscal Year
            </p>
            <h2 className="text-xl font-extrabold">Year-to-Date Summary</h2>
          </div>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Earnings */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="text-muted-foreground text-sm">Total Net Earnings</span>
              <span className="font-bold text-lg">{totalNetEarnings}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-muted-foreground text-xs">Total Deductions</p>
              <p className="font-semibold">{totalDeductions}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Gross Pay</p>
              <p className="font-semibold">{grossPay}</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onViewBreakdown}
          className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>View Full Breakdown</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
