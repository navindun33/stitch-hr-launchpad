import { useState } from 'react';
import { usePayrollRecords, useCreatePayrollRecord, useUpdatePayrollStatus, PayrollRecord } from '@/hooks/usePayroll';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Loader2, Search, Calendar, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  processed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function PayrollManagement() {
  const { data: payrollRecords = [], isLoading } = usePayrollRecords();
  const { data: employees = [] } = useEmployees();
  const createPayroll = useCreatePayrollRecord();
  const updateStatus = useUpdatePayrollStatus();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [deductions, setDeductions] = useState('0');

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employee?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setEmployeeId('');
    setPeriodStart('');
    setPeriodEnd('');
    setHoursWorked('');
    setDeductions('0');
  };

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const calculatedGross = selectedEmployee 
    ? parseFloat(hoursWorked || '0') * selectedEmployee.hourly_rate 
    : 0;
  const calculatedNet = calculatedGross - parseFloat(deductions || '0');

  const handleCreate = async () => {
    if (!employeeId || !periodStart || !periodEnd || !hoursWorked) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedEmployee) {
      toast.error('Employee not found');
      return;
    }

    try {
      await createPayroll.mutateAsync({
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        hours_worked: parseFloat(hoursWorked),
        hourly_rate: selectedEmployee.hourly_rate,
        gross_pay: calculatedGross,
        deductions: parseFloat(deductions || '0'),
        net_pay: calculatedNet,
      });
      toast.success('Payroll record created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create payroll record');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'pending' | 'processed' | 'paid') => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Payroll ${status === 'paid' ? 'marked as paid' : 'updated'}`);
    } catch (error) {
      toast.error('Failed to update payroll status');
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
              placeholder="Search by employee..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Payroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payroll Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} (${emp.hourly_rate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start *</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End *</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hoursWorked">Hours Worked *</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions ($)</Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                  />
                </div>
              </div>
              
              {selectedEmployee && hoursWorked && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hourly Rate:</span>
                    <span>${selectedEmployee.hourly_rate}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gross Pay:</span>
                    <span>${calculatedGross.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Deductions:</span>
                    <span>-${parseFloat(deductions || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Net Pay:</span>
                    <span className="text-primary">${calculatedNet.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createPayroll.isPending}>
                {createPayroll.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payroll List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No payroll records found
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{record.employee?.name}</h3>
                      <Badge className={statusColors[record.status]}>{record.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(record.period_start), 'MMM d')} - {format(new Date(record.period_end), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {record.hours_worked} hours
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${record.hourly_rate}/hr
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>Gross: <span className="font-medium">${record.gross_pay.toFixed(2)}</span></span>
                      <span>Deductions: <span className="font-medium text-red-600">-${record.deductions.toFixed(2)}</span></span>
                      <span>Net: <span className="font-bold text-primary">${record.net_pay.toFixed(2)}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {record.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(record.id, 'processed')}
                        disabled={updateStatus.isPending}
                      >
                        Process
                      </Button>
                    )}
                    {record.status === 'processed' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(record.id, 'paid')}
                        disabled={updateStatus.isPending}
                      >
                        Mark Paid
                      </Button>
                    )}
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
