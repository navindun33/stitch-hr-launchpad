import { 
  Home, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Clock,
  Users,
  ClipboardCheck
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    icon: <Home className="h-6 w-6" />,
    activeIcon: <Home className="h-6 w-6 fill-current" />,
    label: "Home",
    path: "/",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    activeIcon: <Clock className="h-6 w-6 fill-current" />,
    label: "Attend",
    path: "/attendance",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    activeIcon: <Calendar className="h-6 w-6 fill-current" />,
    label: "Leave",
    path: "/leave",
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    activeIcon: <DollarSign className="h-6 w-6 fill-current" />,
    label: "Payroll",
    path: "/payroll",
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border pb-6 pt-2 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive ? item.activeIcon : item.icon}
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
