import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartments, Department } from '@/hooks/useCompanies';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function DepartmentManagement() {
  const { user } = useAuth();
  const { data: currentEmployee } = useCurrentEmployee(user?.id);
  const companyId = currentEmployee?.company_id;
  const { data: departments = [], isLoading } = useDepartments(companyId);
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createDepartment = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company found');
      
      const { error } = await supabase
        .from('departments')
        .insert({
          company_id: companyId,
          name,
          description: description || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('A department with this name already exists');
      } else {
        toast.error('Failed to create department');
      }
    },
  });

  const updateDepartment = useMutation({
    mutationFn: async () => {
      if (!editingDept) return;
      
      const { error } = await supabase
        .from('departments')
        .update({
          name,
          description: description || null,
        })
        .eq('id', editingDept.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      setEditingDept(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update department');
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete department');
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No company associated with your account
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Departments</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name *</Label>
                <Input
                  id="dept-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Human Resources"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-desc">Description</Label>
                <Textarea
                  id="dept-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={() => createDepartment.mutate()} 
                disabled={createDepartment.isPending || !name}
              >
                {createDepartment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {departments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No departments yet</p>
              <p className="text-sm">Create your first department to get started</p>
            </CardContent>
          </Card>
        ) : (
          departments.map((dept) => (
            <Card key={dept.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{dept.name}</h4>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog open={editingDept?.id === dept.id} onOpenChange={(open) => !open && setEditingDept(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Department</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-dept-name">Department Name *</Label>
                            <Input
                              id="edit-dept-name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-dept-desc">Description</Label>
                            <Textarea
                              id="edit-dept-desc"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            onClick={() => updateDepartment.mutate()} 
                            disabled={updateDepartment.isPending || !name}
                          >
                            {updateDepartment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{dept.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDepartment.mutate(dept.id)}
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
