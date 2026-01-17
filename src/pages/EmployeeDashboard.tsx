import { Timer, Calendar, ChevronRight, Megaphone, Wallet, CalendarDays, Umbrella } from "lucide-react";
import { Link } from "react-router-dom";
import { UserHeader } from "@/components/layout/UserHeader";
import { BottomNav } from "@/components/layout/BottomNav";

export default function EmployeeDashboard() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <UserHeader 
        userName="Alex Miller" 
        greeting="Good Morning" 
        avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      />

      {/* Quick Actions */}
      <div className="px-6 py-4">
        <div className="flex gap-3">
          <Link 
            to="/attendance"
            className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-primary text-primary-foreground shadow-lg fab-shadow active:scale-[0.98] transition-transform"
          >
            <Timer className="h-7 w-7" />
            <span className="text-sm font-bold">Clock In</span>
          </Link>
          <Link 
            to="/leave"
            className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-card text-primary border border-primary/10 card-shadow active:scale-[0.98] transition-transform"
          >
            <CalendarDays className="h-7 w-7 text-primary" />
            <span className="text-sm font-bold text-foreground">Request Leave</span>
          </Link>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-6 pb-2">
        <div className="bg-primary/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <p className="text-sm font-medium text-primary">Currently clocked in: 09:12 AM</p>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-6 pt-6 pb-2 flex justify-between items-end">
        <h3 className="text-lg font-extrabold tracking-tight">Overview</h3>
        <button className="text-primary text-xs font-bold uppercase tracking-widest">See Stats</button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-8">
        {/* Leave Balance */}
        <Link 
          to="/leave"
          className="flex flex-col gap-4 rounded-2xl bg-card p-5 card-shadow border border-border active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold">12.5</span>
            <span className="text-xs font-medium text-muted-foreground">Leave Balance</span>
          </div>
        </Link>

        {/* Next Holiday */}
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 card-shadow border border-border">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Umbrella className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold">Sept 4</span>
            <span className="text-xs font-medium text-muted-foreground">Labor Day</span>
          </div>
        </div>

        {/* Announcement Card */}
        <div className="col-span-2 flex flex-col gap-3 rounded-2xl bg-card p-5 card-shadow border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                New Announcement
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">2h ago</span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <h4 className="text-base font-bold">Q3 Team Offsite Meeting</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Join us next Friday at 3:00 PM for the quarterly strategy session and team building activities...
            </p>
          </div>
          <div className="flex -space-x-2 mt-2 relative z-10">
            <div 
              className="w-6 h-6 rounded-full border-2 border-card bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face')" }}
            />
            <div 
              className="w-6 h-6 rounded-full border-2 border-card bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face')" }}
            />
            <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              +14
            </div>
          </div>
        </div>

        {/* Payroll Summary */}
        <Link 
          to="/payroll"
          className="col-span-2 flex items-center justify-between rounded-2xl bg-foreground p-5 text-background"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-background" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-background/60 uppercase tracking-widest">Next Payday</p>
              <p className="text-lg font-bold">Aug 31st</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-background/40" />
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
