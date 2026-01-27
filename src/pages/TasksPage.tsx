import { useState, useMemo } from "react";
import { GitBranch, ChevronRight, ChevronDown, CornerDownRight } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { TabNav } from "@/components/ui/TabNav";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useMyTasks, Task, buildTaskTree } from "@/hooks/useTasks";
import { useCurrentEmployee } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const tabs = ["To Do", "In Progress", "Done"];

const mapStatusToTab = (status: string): string => {
  switch (status) {
    case 'pending': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Done';
    case 'cancelled': return 'Done';
    default: return 'To Do';
  }
};

interface TaskTreeNodeProps {
  task: Task;
  level: number;
  expandedTasks: Set<string>;
  toggleExpanded: (id: string) => void;
}

function TaskTreeNode({ task, level, expandedTasks, toggleExpanded }: TaskTreeNodeProps) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);

  return (
    <div className={level > 0 ? 'ml-4 pl-4 border-l-2 border-muted' : ''}>
      <div className="flex items-start gap-2">
        {hasSubtasks ? (
          <button
            onClick={() => toggleExpanded(task.id)}
            className="mt-4 p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : level > 0 ? (
          <CornerDownRight className="h-4 w-4 text-muted-foreground mt-4 flex-shrink-0" />
        ) : (
          <div className="w-6" />
        )}
        
        <div className="flex-1">
          <TaskCard
            title={task.title}
            category={task.description || 'Task'}
            dueDate={task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
            priority={task.priority as 'high' | 'medium' | 'low'}
            onView={() => console.log("View task", task.id)}
          />
          {hasSubtasks && (
            <Badge variant="outline" className="mt-1 ml-2 text-xs gap-1">
              <GitBranch className="h-3 w-3" />
              {task.subtasks!.length} subtask{task.subtasks!.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {hasSubtasks && isExpanded && (
        <div className="mt-2 space-y-2">
          {task.subtasks!.map((subtask) => (
            <TaskTreeNode
              key={subtask.id}
              task={subtask}
              level={level + 1}
              expandedTasks={expandedTasks}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("To Do");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee(user?.id);
  const { data: tasks = [], isLoading: tasksLoading } = useMyTasks(currentEmployee?.id);

  const isLoading = employeeLoading || tasksLoading;

  // Build tree and filter by status
  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const filterTasksByStatus = (task: Task, tab: string): boolean => {
    const taskMatchesTab = mapStatusToTab(task.status) === tab;
    
    // If task matches, include it
    if (taskMatchesTab) return true;
    
    // If task has subtasks that match, include the parent
    if (task.subtasks && task.subtasks.length > 0) {
      return task.subtasks.some(subtask => filterTasksByStatus(subtask, tab));
    }
    
    return false;
  };

  const currentTasks = useMemo(() => {
    return taskTree.filter(task => filterTasksByStatus(task, activeTab));
  }, [taskTree, activeTab]);

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No tasks in this category</p>
          </div>
        ) : (
          <>
            {activeTab === "To Do" && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">
                Today • {format(new Date(), 'MMM d')}
              </p>
            )}

            {currentTasks.map((task) => (
              <TaskTreeNode
                key={task.id}
                task={task}
                level={0}
                expandedTasks={expandedTasks}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
