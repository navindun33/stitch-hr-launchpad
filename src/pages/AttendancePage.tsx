import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapPin, LogIn, LogOut, Coffee } from "lucide-react";

export default function AttendancePage() {
  const [time, setTime] = useState({ hours: 6, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let newSeconds = prev.seconds + 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;

        if (newSeconds >= 60) {
          newSeconds = 0;
          newMinutes++;
        }
        if (newMinutes >= 60) {
          newMinutes = 0;
          newHours++;
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (n: number) => n.toString().padStart(2, "0");

  // Calculate progress for circular ring (8 hour shift = 75% at ~6 hours)
  const progressPercent = Math.min(((time.hours * 60 + time.minutes) / 480) * 100, 100);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progressPercent / 100);

  const weeklyData = [
    { day: "Mon", hours: 8.2, height: 48 },
    { day: "Tue", hours: 8.5, height: 52 },
    { day: "Wed", hours: 7.0, height: 40 },
    { day: "Thu", hours: null, height: 60, active: true },
    { day: "Fri", hours: null, height: 10 },
    { day: "Sat", hours: null, height: 10 },
  ];

  const activityLog = [
    { 
      icon: <LogIn className="h-5 w-5" />, 
      title: "Shift Started", 
      time: "Oct 23, 08:30 AM", 
      meta: "Austin HQ",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600"
    },
    { 
      icon: <Coffee className="h-5 w-5" />, 
      title: "Break Ended", 
      time: "Oct 22, 01:00 PM", 
      meta: "45 mins",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Attendance" showBack showHelp />

      <main className="max-w-md mx-auto pb-24">
        {/* Status Header */}
        <div className="p-4 flex justify-between items-end">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Monday, Oct 23</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Active Shift</h1>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-primary text-xs font-bold uppercase tracking-wider">On Duty</span>
          </div>
        </div>

        {/* Circular Clock-In Hub */}
        <div className="px-4 py-2">
          <div className="bg-card rounded-3xl p-8 flex flex-col items-center card-shadow border border-border">
            <div className="relative flex items-center justify-center mb-6">
              {/* Outer Ring */}
              <svg className="w-64 h-64 -rotate-90">
                <circle
                  className="text-muted"
                  cx="128"
                  cy="128"
                  r="120"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary transition-all duration-1000"
                  cx="128"
                  cy="128"
                  r="120"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>

              {/* Inner Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex gap-2 mb-2">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-extrabold tracking-tighter">
                      {formatTime(time.hours)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Hrs
                    </span>
                  </div>
                  <span className="text-4xl font-extrabold text-primary">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-extrabold tracking-tighter">
                      {formatTime(time.minutes)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Min
                    </span>
                  </div>
                  <span className="text-4xl font-extrabold text-primary">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-extrabold tracking-tighter text-primary">
                      {formatTime(time.seconds)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Sec
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Started at 08:30 AM</p>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg fab-shadow hover:scale-[0.98] transition-transform">
              <LogOut className="h-5 w-5" />
              Clock Out
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex gap-4 p-4 overflow-x-auto hide-scrollbar">
          <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-primary/5 border border-primary/10">
            <p className="text-muted-foreground text-xs font-semibold">Today's Earnings</p>
            <p className="text-primary tracking-tight text-xl font-extrabold">$142.50</p>
          </div>
          <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-card border border-border">
            <p className="text-muted-foreground text-xs font-semibold">Next Break</p>
            <p className="tracking-tight text-xl font-extrabold">12:30 PM</p>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold tracking-tight">Weekly Overview</h3>
            <button className="text-primary text-sm font-bold">View History</button>
          </div>
          <div className="bg-card rounded-2xl p-4 card-shadow border border-border">
            <div className="flex justify-between items-end mb-6">
              {weeklyData.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${item.active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.day}
                  </span>
                  <div 
                    className={`w-8 rounded-t-full relative ${
                      item.hours === null && !item.active ? "bg-muted" : item.active ? "bg-primary/20" : "bg-primary"
                    }`}
                    style={{ height: `${item.height}px` }}
                  >
                    {item.active && (
                      <div 
                        className="absolute bottom-0 w-full bg-primary rounded-t-full" 
                        style={{ height: "60%" }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${item.active ? "text-primary font-extrabold" : item.hours ? "" : "text-muted-foreground"}`}>
                    {item.active ? "Active" : item.hours ? `${item.hours}h` : "-"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-dashed border-border">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <p className="text-xs font-bold text-muted-foreground">Current Location</p>
                <p className="text-sm font-semibold">Headquarters - Austin, TX</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="px-4 py-4">
          <h3 className="text-lg font-bold tracking-tight mb-4">Activity Log</h3>
          <div className="space-y-3">
            {activityLog.map((log, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 bg-card p-3 rounded-xl border border-border"
              >
                <div className={`w-10 h-10 rounded-lg ${log.bgColor} flex items-center justify-center ${log.iconColor}`}>
                  {log.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{log.title}</p>
                  <p className="text-xs text-muted-foreground">{log.time}</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{log.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
