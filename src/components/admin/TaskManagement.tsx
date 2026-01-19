import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '@/hooks/useTasks';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, Calendar, User, Clock } from 'lucide-react';
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
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [dueDate, setDueDate] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('medium');
    setStatus('pending');
    setDueDate('');
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
        priority,
        due_date: dueDate || undefined,
      });
      toast.success('Task created successfully');
      setIsCreateOpen(false);
      resetForm();
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
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
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
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No tasks found
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{task.title}</h3>
                      <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                      <Badge className={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge>
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
                  
                  <div className="flex gap-2">
                    <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(task)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
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
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(task.id)}
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
          ))
        )}
      </div>
    </div>
  );
}
