import { UserHeader } from "@/components/layout/UserHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  Users,
  ChevronRight,
  Clock,
  ClipboardCheck,
  BookUser,
  LogIn,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const quickActions = [
  { icon: <CheckCircle className="h-6 w-6" />, label: "Tasks", path: "/tasks", count: 5 },
  { icon: <Calendar className="h-6 w-6" />, label: "Leave", path: "/leave", count: 14 },
  { icon: <TrendingUp className="h-6 w-6" />, label: "Payroll", path: "/payroll" },
  { icon: <Users className="h-6 w-6" />, label: "Directory", path: "/directory" },
];

const upcomingTasks = [
  { title: "Update Employee Handbook", due: "Today", priority: "high" as const },
  { title: "Benefits Enrollment Review", due: "Oct 28", priority: "medium" as const },
];

const moreLinks = [
  { icon: <ClipboardCheck className="h-5 w-5" />, label: "Approvals", path: "/approvals", badge: "3" },
  { icon: <Clock className="h-5 w-5" />, label: "Attendance", path: "/attendance" },
  { icon: <BookUser className="h-5 w-5" />, label: "Employee Dashboard", path: "/dashboard" },
];

export default function Index() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClockedIn) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    setIsClockedIn(true);
    setClockInTime(new Date());
    setElapsedTime(0);
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setClockInTime(null);
    setElapsedTime(0);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <UserHeader userName="Alex Rivera" greeting="Good Morning" />

      <main className="px-4 space-y-6">
        {/* Welcome Section */}
        <div className="pt-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening today
          </p>
        </div>

        {/* Check In/Out Card */}
        <div className="bg-card rounded-xl p-4 card-shadow border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Today's Shift</h2>
              <p className="text-muted-foreground text-sm">
                {isClockedIn && clockInTime 
                  ? `Clocked in at ${clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : "You haven't clocked in yet"
                }
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isClockedIn ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {isClockedIn && (
            <div className="text-center mb-4">
              <p className="text-3xl font-bold font-mono text-primary">{formatTime(elapsedTime)}</p>
              <p className="text-xs text-muted-foreground mt-1">Time elapsed</p>
            </div>
          )}

          <button
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              isClockedIn 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isClockedIn ? (
              <>
                <LogOut className="h-5 w-5" />
                Clock Out
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Clock In
              </>
            )}
          </button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="bg-card rounded-xl p-4 card-shadow border border-border flex flex-col gap-3 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {action.icon}
                </div>
                {action.count !== undefined && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {action.count}
                  </span>
                )}
              </div>
              <p className="font-bold">{action.label}</p>
            </Link>
          ))}
        </div>

        {/* More Links */}
        <div>
          <h2 className="text-lg font-bold mb-3">Quick Access</h2>
          <div className="space-y-2">
            {moreLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="bg-card rounded-xl p-4 card-shadow border border-border flex items-center justify-between hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {link.icon}
                  </div>
                  <span className="font-semibold">{link.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {link.badge && (
                    <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-primary text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-4 card-shadow border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.priority === "high" 
                      ? "bg-red-100 text-red-600" 
                      : "bg-amber-100 text-amber-600"
                  }`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {task.due}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Leave Balance Quick View */}
        <Link to="/leave" className="block bg-card rounded-xl p-4 card-shadow border border-border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Leave Balance</h2>
            <span className="text-primary text-sm font-medium flex items-center gap-1">
              Details <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-muted"
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="88"
                  strokeDashoffset="38"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                14
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual</span>
                <span className="font-medium">14/25 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sick</span>
                <span className="font-medium">8/10 days</span>
              </div>
            </div>
          </div>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
