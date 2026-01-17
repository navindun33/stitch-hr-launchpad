import { useState } from "react";
import { Check, Calendar, Receipt, SlidersHorizontal } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";

const tabs = ["Pending", "History"];

const leaveRequests = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Product Designer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    type: "Annual Leave",
    dates: "Oct 12 - Oct 14",
    days: 3,
    timeAgo: "2h ago",
    leaveColor: "border-primary",
    icon: <Calendar className="h-5 w-5 text-primary" />,
  },
  {
    id: 2,
    name: "Marcus Thorne",
    role: "iOS Developer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    type: "Sick Leave",
    dates: "Oct 05",
    days: 1,
    timeAgo: "5h ago",
    leaveColor: "border-orange-400",
    icon: <Calendar className="h-5 w-5 text-orange-400" />,
  },
];

const expenseClaims = [
  {
    id: 1,
    name: "Elena Rodriguez",
    category: "Office Supplies",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    amount: "$142.50",
    hasReceipt: true,
  },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("Pending");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 pt-10 pb-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button className="text-foreground">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">Approval Queue</h1>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-card card-shadow">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          </button>
        </div>
      </header>

      {/* Segmented Control */}
      <div className="px-4 py-2 max-w-md mx-auto w-full">
        <div className="flex h-11 items-center justify-center rounded-xl bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-bold transition-all",
                activeTab === tab
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6 max-w-md mx-auto w-full">
        {/* Leave Requests Section */}
        <section>
          <div className="flex items-center justify-between py-4">
            <h2 className="text-xl font-extrabold tracking-tight">Leave Requests</h2>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              3 New
            </span>
          </div>

          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div
                key={request.id}
                className="bg-card rounded-xl p-4 card-shadow border border-border"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${request.avatar})` }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold">{request.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {request.role}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{request.timeAgo}</span>
                </div>

                {/* Leave Info */}
                <div className={cn("bg-muted rounded-lg p-3 mb-4 border-l-4", request.leaveColor)}>
                  <div className="flex items-start gap-3">
                    {request.icon}
                    <div>
                      <p className="text-sm font-bold">{request.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.dates} ({request.days} day{request.days > 1 ? "s" : ""})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button className="flex-1 h-11 bg-muted text-foreground rounded-lg font-bold text-sm flex items-center justify-center">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Expense Claims Section */}
        <section>
          <div className="flex items-center justify-between py-4">
            <h2 className="text-xl font-extrabold tracking-tight">Expense Claims</h2>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              1 Pending
            </span>
          </div>

          {expenseClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-card rounded-xl p-4 card-shadow border border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${claim.avatar})` }}
                  />
                  <div>
                    <h3 className="font-bold">{claim.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Receipt className="h-3 w-3" />
                      <p className="text-[10px] font-medium uppercase tracking-wider">
                        {claim.category}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">{claim.amount}</p>
                  {claim.hasReceipt && (
                    <p className="text-[10px] text-primary font-bold">Receipt attached</p>
                  )}
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4 flex items-center justify-center h-24 relative cursor-pointer overflow-hidden group">
                <div className="relative z-[1] flex flex-col items-center text-primary">
                  <Receipt className="h-8 w-8" />
                  <span className="text-xs font-bold mt-1">Tap to View Receipt</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg font-bold text-sm flex items-center justify-center">
                  Approve Claim
                </button>
                <button className="flex-1 h-11 bg-muted text-foreground rounded-lg font-bold text-sm flex items-center justify-center">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
