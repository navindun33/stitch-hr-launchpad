import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaystubCardProps {
  month: string;
  year: string;
  netPay: string;
  isAdjusted?: boolean;
  onDownload?: () => void;
}

export function PaystubCard({
  month,
  year,
  netPay,
  isAdjusted = false,
  onDownload,
}: PaystubCardProps) {
  return (
    <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border card-shadow active:bg-muted/50 transition-colors animate-fade-in">
      {/* Icon */}
      <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 w-12 h-12">
        <FileText className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold leading-none">
            {month} {year}
          </p>
          {isAdjusted && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              Adj.
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Net Pay: <span className="text-foreground">{netPay}</span>
        </p>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-primary hover:bg-primary/5 transition-colors"
      >
        <Download className="h-5 w-5" />
      </button>
    </div>
  );
}
