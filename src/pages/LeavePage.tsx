import { useState } from "react";
import { Plus } from "lucide-react";
import { UserHeader } from "@/components/layout/UserHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { LeaveBalanceCard } from "@/components/leave/LeaveBalanceCard";
import { LeaveRequestCard } from "@/components/leave/LeaveRequestCard";
import { FilterChips } from "@/components/ui/FilterChips";

const filterOptions = ["All", "Pending", "Approved", "Rejected"];

const leaveRequests = [
  {
    type: "Annual Leave",
    startDate: "Nov 01",
    endDate: "Nov 05",
    days: 5,
    month: "Nov",
    day: "01",
    status: "pending" as const,
  },
  {
    type: "Sick Leave",
    startDate: "Oct 12",
    endDate: "Oct 13",
    days: 2,
    month: "Oct",
    day: "12",
    status: "approved" as const,
  },
  {
    type: "Casual Leave",
    startDate: "Sep 20",
    days: 1,
    month: "Sep",
    day: "20",
    status: "rejected" as const,
  },
  {
    type: "Annual Leave",
    startDate: "Aug 15",
    endDate: "Aug 25",
    days: 10,
    month: "Aug",
    day: "15",
    status: "approved" as const,
  },
];

const leaveTypes = [
  { name: "Annual Leave", used: 11, total: 25, color: "primary" as const },
  { name: "Sick Leave", used: 2, total: 10, color: "orange" as const },
  { name: "Casual Leave", used: 3, total: 5, color: "blue" as const },
];

export default function LeavePage() {
  const [filter, setFilter] = useState("All");

  const filteredRequests = leaveRequests.filter((request) => {
    if (filter === "All") return true;
    return request.status === filter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <UserHeader userName="Alex Rivera" greeting="Good Morning" />

      <main className="px-4 pb-32">
        {/* Screen Title */}
        <div className="py-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Leave Balance</h1>
        </div>

        {/* Balance Card */}
        <LeaveBalanceCard daysLeft={14} leaveTypes={leaveTypes} />

        {/* Filter Section */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Recent Requests</h3>
          <FilterChips
            options={filterOptions}
            selected={filter}
            onSelect={setFilter}
          />
        </div>

        {/* Request List */}
        <div className="mt-4 space-y-3">
          {filteredRequests.map((request, index) => (
            <LeaveRequestCard key={index} {...request} />
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center fab-shadow z-40 transition-transform hover:scale-105 active:scale-95">
        <Plus className="h-8 w-8" />
      </button>

      <BottomNav />
    </div>
  );
}
