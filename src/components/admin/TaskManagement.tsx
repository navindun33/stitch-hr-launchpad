import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task, buildTaskTree } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, Calendar, User, Clock, ChevronRight, ChevronDown, GitBranch, CornerDownRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

interface TaskTreeItemProps {
  task: Task;
  level: number;
  employees: { id: string; name: string }[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (parentId: string) => void;
  expandedTasks: Set<string>;
  toggleExpanded: (id: string) => void;
}

function TaskTreeItem({ 
  task, 
  level, 
  employees, 
  onEdit, 
  onDelete, 
  onAddSubtask,
  expandedTasks,
  toggleExpanded
}: TaskTreeItemProps) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);

  return (
    <div className={level > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}>
      <Card className={level > 0 ? 'border-l-4 border-l-primary/30' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Expand/Collapse button */}
            <div className="flex items-center justify-center w-6 h-6 mt-0.5">
              {hasSubtasks ? (
                <button
                  onClick={() => toggleExpanded(task.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : level > 0 ? (
                <CornerDownRight className="h-4 w-4 text-muted-foreground" />
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold truncate">{task.title}</h3>
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                <Badge className={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge>
                {hasSubtasks && (
                  <Badge variant="outline" className="gap-1">
                    <GitBranch className="h-3 w-3" />
                    {task.subtasks!.length} subtask{task.subtasks!.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {task.assigned_employee && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assigned_employee.name}
                  </span>
                )}
                {task.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created: {format(new Date(task.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="flex gap-1 flex-shrink-0">
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => onAddSubtask(task.id)}
                title="Add subtask"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? {hasSubtasks && 'All subtasks will also be deleted.'} This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(task.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="mt-2 space-y-2">
          {task.subtasks!.map((subtask) => (
            <TaskTreeItem
              key={subtask.id}
              task={subtask}
              level={level + 1}
              employees={employees}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              expandedTasks={expandedTasks}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskManagement() {
  const { user } = useAuth();
  const { data: currentEmployee } = useCurrentEmployee(user?.id);
  const { data: tasks = [], isLoading } = useTasks();
  const { data: employees = [] } = useEmployees();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [dueDate, setDueDate] = useState('');

  // Build task tree
  const taskTree = buildTaskTree(tasks);

  const filteredTasks = taskTree.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const expandAll = () => {
    const allIds = new Set(tasks.map(t => t.id));
    setExpandedTasks(allIds);
  };

  const collapseAll = () => {
    setExpandedTasks(new Set());
  };

  const getParentTaskName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = tasks.find(t => t.id === parentId);
    return parent?.title || null;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('medium');
    setStatus('pending');
    setDueDate('');
    setParentTaskId(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setAssignedTo(task.assigned_to || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.due_date || '');
  };

  const openAddSubtaskDialog = (parentId: string) => {
    resetForm();
    setParentTaskId(parentId);
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!title) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await createTask.mutateAsync({
        title,
        description: description || undefined,
        assigned_to: assignedTo || undefined,
        created_by: currentEmployee?.id,
        parent_id: parentTaskId || undefined,
        priority,
        due_date: dueDate || undefined,
      });
      toast.success(parentTaskId ? 'Subtask created successfully' : 'Task created successfully');
      setIsCreateOpen(false);
      resetForm();
      
      // Auto-expand parent if adding subtask
      if (parentTaskId) {
        setExpandedTasks(prev => new Set([...prev, parentTaskId]));
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdate = async () => {
    if (!editingTask) return;

    try {
      await updateTask.mutateAsync({
        id: editingTask.id,
        title,
        description: description || undefined,
        assigned_to: assignedTo || null,
        priority,
        status,
        due_date: dueDate || null,
      });
      toast.success('Task updated successfully');
      setEditingTask(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {parentTaskId ? (
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Add Subtask to: {getParentTaskName(parentTaskId)}
                    </span>
                  ) : (
                    'Create New Task'
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={createTask.isPending}>
                  {createTask.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {parentTaskId ? 'Add Subtask' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task Tree */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No tasks found
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <TaskTreeItem
              key={task.id}
              task={task}
              level={0}
              employees={employees}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddSubtask={openAddSubtaskDialog}
              expandedTasks={expandedTasks}
              toggleExpanded={toggleExpanded}
            />
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdate} disabled={updateTask.isPending}>
              {updateTask.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
