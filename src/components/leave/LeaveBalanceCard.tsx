interface LeaveType {
  name: string;
  used: number;
  total: number;
  color: "primary" | "orange" | "blue";
}

interface LeaveBalanceCardProps {
  daysLeft: number;
  leaveTypes: LeaveType[];
}

const colorMap = {
  primary: "bg-primary",
  orange: "bg-orange-500",
  blue: "bg-blue-500",
};

const textColorMap = {
  primary: "text-primary",
  orange: "text-orange-500",
  blue: "text-blue-500",
};

export function LeaveBalanceCard({ daysLeft, leaveTypes }: LeaveBalanceCardProps) {
  // Calculate stroke dashoffset for the circular progress
  const circumference = 2 * Math.PI * 40;
  const totalDays = leaveTypes.reduce((acc, lt) => acc + lt.total, 0);
  const usedDays = leaveTypes.reduce((acc, lt) => acc + lt.used, 0);
  const remainingPercentage = ((totalDays - usedDays) / totalDays);
  const strokeDashoffset = circumference * (1 - remainingPercentage);

  return (
    <div className="bg-card rounded-xl p-6 card-shadow border border-border flex flex-col md:flex-row items-center gap-8">
      {/* Circular Progress */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            className="text-muted"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold">{daysLeft}</span>
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            Days Left
          </span>
        </div>
      </div>

      {/* Leave Type Bars */}
      <div className="flex-1 space-y-4 w-full">
        {leaveTypes.map((leave) => (
          <div key={leave.name}>
            <div className="flex justify-between items-end mb-1">
              <p className="text-sm font-medium text-muted-foreground">{leave.name}</p>
              <p className={`text-xs font-bold ${textColorMap[leave.color]}`}>
                {leave.total - leave.used} / {leave.total}
              </p>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colorMap[leave.color]}`}
                style={{ width: `${((leave.total - leave.used) / leave.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
