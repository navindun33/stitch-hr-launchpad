import { useState } from 'react';
import { useEmployees, Employee, useCurrentEmployee } from '@/hooks/useEmployees';
import { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useAdminEmployees';
import { useDepartments } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, Mail, Phone, Building, CreditCard, IdCard } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const DEFAULT_DEPARTMENTS = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations', 'Legal', 'Support', 'General'];

export function EmployeeManagement() {
  const { user } = useAuth();
  const { data: currentEmployee } = useCurrentEmployee(user?.id);
  const companyId = currentEmployee?.company_id;
  const { data: employees = [], isLoading } = useEmployees();
  const { data: customDepartments = [] } = useDepartments(companyId);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [phone, setPhone] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Combine default and custom departments
  const allDepartments = [
    ...DEFAULT_DEPARTMENTS,
    ...customDepartments.map(d => d.name).filter(name => !DEFAULT_DEPARTMENTS.includes(name))
  ];

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.department.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setEmail('');
    setDepartment('');
    setHourlyRate('');
    setPhone('');
    setNicNumber('');
    setBankName('');
    setBankAccountNumber('');
    setBankBranch('');
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setName(employee.name);
    setEmail(employee.email);
    setDepartment(employee.department);
    setHourlyRate(employee.hourly_rate.toString());
    setPhone(employee.phone || '');
    setNicNumber(employee.nic_number || '');
    setBankName(employee.bank_name || '');
    setBankAccountNumber(employee.bank_account_number || '');
    setBankBranch(employee.bank_branch || '');
  };

  const handleCreate = async () => {
    if (!name || !email || !department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createEmployee.mutateAsync({
        name,
        email,
        department,
        hourly_rate: parseFloat(hourlyRate) || 0,
        phone: phone || undefined,
        company_id: companyId || undefined,
        nic_number: nicNumber || undefined,
        bank_name: bankName || undefined,
        bank_account_number: bankAccountNumber || undefined,
        bank_branch: bankBranch || undefined,
      });
      toast.success('Employee created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create employee');
    }
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    try {
      await updateEmployee.mutateAsync({
        id: editingEmployee.id,
        name,
        email,
        department,
        hourly_rate: parseFloat(hourlyRate) || 0,
        phone: phone || undefined,
        nic_number: nicNumber || undefined,
        bank_name: bankName || undefined,
        bank_account_number: bankAccountNumber || undefined,
        bank_branch: bankBranch || undefined,
      });
      toast.success('Employee updated successfully');
      setEditingEmployee(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update employee');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee.mutateAsync(id);
      toast.success('Employee deleted successfully');
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const renderEmployeeForm = (isEdit: boolean = false) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? 'edit-' : ''}name`}>Full Name *</Label>
        <Input id={`${isEdit ? 'edit-' : ''}name`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? 'edit-' : ''}email`}>Email *</Label>
        <Input id={`${isEdit ? 'edit-' : ''}email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? 'edit-' : ''}department`}>Department *</Label>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {allDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? 'edit-' : ''}hourlyRate`}>Hourly Rate ($)</Label>
          <Input
            id={`${isEdit ? 'edit-' : ''}hourlyRate`}
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? 'edit-' : ''}phone`}>Phone</Label>
          <Input id={`${isEdit ? 'edit-' : ''}phone`} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <IdCard className="h-4 w-4" />
          Identification
        </p>
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? 'edit-' : ''}nic`}>NIC Number</Label>
          <Input
            id={`${isEdit ? 'edit-' : ''}nic`}
            value={nicNumber}
            onChange={(e) => setNicNumber(e.target.value)}
            placeholder="National ID"
          />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Bank Details
        </p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${isEdit ? 'edit-' : ''}bankName`}>Bank Name</Label>
            <Input
              id={`${isEdit ? 'edit-' : ''}bankName`}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${isEdit ? 'edit-' : ''}bankAccount`}>Account Number</Label>
              <Input
                id={`${isEdit ? 'edit-' : ''}bankAccount`}
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${isEdit ? 'edit-' : ''}bankBranch`}>Branch</Label>
              <Input
                id={`${isEdit ? 'edit-' : ''}bankBranch`}
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            {renderEmployeeForm(false)}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createEmployee.isPending}>
                {createEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee List */}
      <div className="space-y-3">
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No employees found
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <Card key={employee.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{employee.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {employee.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </span>
                      {employee.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1">
                      <p className="text-sm font-medium text-primary">
                        ${employee.hourly_rate}/hr
                      </p>
                      {employee.nic_number && (
                        <p className="text-xs text-muted-foreground">
                          NIC: {employee.nic_number}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog open={editingEmployee?.id === employee.id} onOpenChange={(open) => !open && setEditingEmployee(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Employee</DialogTitle>
                        </DialogHeader>
                        {renderEmployeeForm(true)}
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleUpdate} disabled={updateEmployee.isPending}>
                            {updateEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
                          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {employee.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(employee.id)}
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
