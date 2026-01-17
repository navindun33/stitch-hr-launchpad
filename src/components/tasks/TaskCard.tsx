import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in-progress" | "done" | "pending-approval";

interface TaskCardProps {
  title: string;
  category: string;
  dueDate: string;
  priority: TaskPriority;
  status?: TaskStatus;
  assignee?: {
    name: string;
    avatar: string;
  };
  onView?: () => void;
  onApprove?: () => void;
}

const priorityConfig = {
  high: {
    badge: "badge-high-priority",
    border: "bg-destructive",
    label: "High Priority",
  },
  medium: {
    badge: "badge-pending",
    border: "bg-accent",
    label: "Medium Priority",
  },
  low: {
    badge: "badge-low-priority",
    border: "bg-primary/30",
    label: "Low Priority",
  },
};

const statusConfig = {
  "pending-approval": {
    badge: "badge-pending",
    label: "Pending Approval",
    showTimer: true,
  },
  todo: null,
  "in-progress": null,
  done: null,
};

export function TaskCard({
  title,
  category,
  dueDate,
  priority,
  status,
  assignee,
  onView,
  onApprove,
}: TaskCardProps) {
  const prioConfig = priorityConfig[priority];
  const statusCfg = status ? statusConfig[status] : null;

  return (
    <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden flex flex-col animate-scale-in">
      <div className={cn("h-1 w-full", prioConfig.border)}></div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            {statusCfg ? (
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide gap-1",
                statusCfg.badge
              )}>
                {statusCfg.showTimer && (
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                )}
                {statusCfg.label}
              </span>
            ) : (
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide",
                prioConfig.badge
              )}>
                {prioConfig.label}
              </span>
            )}
          </div>
          {assignee && (
            <div className="w-8 h-8 rounded-full border-2 border-card bg-cover bg-center overflow-hidden">
              <img 
                src={assignee.avatar} 
                alt={assignee.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {category}
            {priority === "medium" && status !== "pending-approval" && " • Medium Priority"}
          </p>
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Due: {dueDate}</span>
          </div>
          
          {status === "pending-approval" ? (
            <button 
              onClick={onApprove}
              className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm hover:bg-primary/90 transition-colors"
            >
              Approve
            </button>
          ) : onView ? (
            <button 
              onClick={onView}
              className="text-primary text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
