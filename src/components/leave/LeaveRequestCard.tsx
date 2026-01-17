import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaveStatus = "pending" | "approved" | "rejected";

interface LeaveRequestCardProps {
  type: string;
  startDate: string;
  endDate?: string;
  days: number;
  month: string;
  day: string;
  status: LeaveStatus;
}

const statusConfig = {
  pending: {
    badge: "badge-pending",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
    numberColor: "text-orange-700 dark:text-orange-300",
  },
  approved: {
    badge: "badge-approved",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    numberColor: "text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    badge: "badge-rejected",
    bgColor: "bg-red-50 dark:bg-red-500/10",
    textColor: "text-red-600 dark:text-red-400",
    numberColor: "text-red-700 dark:text-red-300",
  },
};

export function LeaveRequestCard({
  type,
  startDate,
  endDate,
  days,
  month,
  day,
  status,
}: LeaveRequestCardProps) {
  const config = statusConfig[status];
  const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;

  return (
    <div className={cn(
      "bg-card p-4 rounded-xl card-shadow border border-border flex items-center gap-4 animate-fade-in",
      status !== "pending" && "opacity-90"
    )}>
      {/* Date Badge */}
      <div className={cn(
        "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0",
        config.bgColor
      )}>
        <span className={cn("text-[10px] font-bold uppercase", config.textColor)}>
          {month}
        </span>
        <span className={cn("text-lg font-extrabold", config.numberColor)}>
          {day}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className="font-bold text-sm truncate">{type}</h4>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
            config.badge
          )}>
            {status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {dateRange} • {days} Day{days > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
