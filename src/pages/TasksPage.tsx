import { useState } from "react";
import { GitBranch } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { TabNav } from "@/components/ui/TabNav";
import { TaskCard } from "@/components/tasks/TaskCard";

const tabs = ["To Do", "In Progress", "Done"];

const tasks = {
  "To Do": [
    {
      id: 1,
      title: "Update Employee Handbook",
      category: "Internal HR",
      dueDate: "Oct 24, 2023",
      priority: "high" as const,
      assignee: {
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      },
    },
    {
      id: 2,
      title: "Benefits Enrollment Review",
      category: "Benefits",
      dueDate: "Oct 28",
      priority: "medium" as const,
      status: "pending-approval" as const,
      assignee: {
        name: "Michael Brown",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      },
    },
    {
      id: 3,
      title: "Quarterly Performance Sync",
      category: "Management",
      dueDate: "Nov 02, 2023",
      priority: "low" as const,
      assignee: {
        name: "Emily Davis",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      },
    },
  ],
  "In Progress": [
    {
      id: 4,
      title: "New Hire Onboarding",
      category: "Onboarding",
      dueDate: "Oct 30",
      priority: "high" as const,
      assignee: {
        name: "Alex Rivera",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      },
    },
  ],
  "Done": [
    {
      id: 5,
      title: "Q3 Compliance Training",
      category: "Training",
      dueDate: "Oct 15",
      priority: "medium" as const,
      assignee: {
        name: "Jordan Lee",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      },
    },
  ],
};

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("To Do");

  const currentTasks = tasks[activeTab as keyof typeof tasks] || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader 
        title="Task Management" 
        icon={<GitBranch className="h-6 w-6" />}
        showAdd 
      />

      {/* Tab Navigation */}
      <div className="sticky top-[73px] z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4">
          <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full p-4 space-y-4 pb-28">
        {activeTab === "To Do" && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">
            Today • Oct 24
          </p>
        )}

        {currentTasks.map((task, index) => (
          <div key={task.id}>
            {activeTab === "To Do" && index === 2 && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-6 mb-2">
                Next Week
              </p>
            )}
            <TaskCard
              title={task.title}
              category={task.category}
              dueDate={task.dueDate}
              priority={task.priority}
              status={task.status}
              assignee={task.assignee}
              onView={() => console.log("View task", task.id)}
              onApprove={task.status === "pending-approval" ? () => console.log("Approve", task.id) : undefined}
            />
          </div>
        ))}

        {currentTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No tasks in this category</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
