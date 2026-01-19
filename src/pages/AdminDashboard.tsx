import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { useLeaveRequests } from '@/hooks/useLeave';
import { usePayrollRecords } from '@/hooks/usePayroll';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  DollarSign, 
  Shield,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { EmployeeManagement } from '@/components/admin/EmployeeManagement';
import { TaskManagement } from '@/components/admin/TaskManagement';
import { LeaveManagement } from '@/components/admin/LeaveManagement';
import { PayrollManagement } from '@/components/admin/PayrollManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isAdminOrManager, isLoading: rolesLoading } = useIsAdmin(user?.id);
  const [activeTab, setActiveTab] = useState('employees');

  const { data: employees = [] } = useEmployees();
  const { data: tasks = [] } = useTasks();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: payrollRecords = [] } = usePayrollRecords();

  const pendingLeave = leaveRequests.filter(r => r.status === 'pending').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const pendingPayroll = payrollRecords.filter(p => p.status === 'pending').length;

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdminOrManager) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Access Denied" showBack />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader title="Admin Dashboard" showBack />
      
      <main className="px-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.length}</p>
                  <p className="text-xs text-muted-foreground">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTasks}</p>
                  <p className="text-xs text-muted-foreground">Pending Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingLeave}</p>
                  <p className="text-xs text-muted-foreground">Leave Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingPayroll}</p>
                  <p className="text-xs text-muted-foreground">Payroll Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Logged in as: {isAdmin ? 'Admin' : 'Manager'}
          </span>
        </div>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employees" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 hidden sm:inline" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 mr-1 hidden sm:inline" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="leave" className="text-xs sm:text-sm">
              <Calendar className="h-4 w-4 mr-1 hidden sm:inline" />
              Leave
            </TabsTrigger>
            <TabsTrigger value="payroll" className="text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 mr-1 hidden sm:inline" />
              Payroll
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="mt-4">
            <EmployeeManagement />
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <TaskManagement />
          </TabsContent>
          
          <TabsContent value="leave" className="mt-4">
            <LeaveManagement />
          </TabsContent>
          
          <TabsContent value="payroll" className="mt-4">
            <PayrollManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
