import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { useEmployees, useCurrentEmployee } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { useLeaveRequests } from '@/hooks/useLeave';
import { usePayrollRecords } from '@/hooks/usePayroll';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  DollarSign, 
  Shield,
  Loader2,
  AlertTriangle,
  FolderOpen,
  LogOut,
  MapPin,
} from 'lucide-react';
import { EmployeeManagement } from '@/components/admin/EmployeeManagement';
import { TaskManagement } from '@/components/admin/TaskManagement';
import { LeaveManagement } from '@/components/admin/LeaveManagement';
import { PayrollManagement } from '@/components/admin/PayrollManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { OfficeLocationManagement } from '@/components/admin/OfficeLocationManagement';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isAdminOrManager, isLoading: rolesLoading } = useIsAdmin(user?.id);
  const [activeTab, setActiveTab] = useState('employees');

  const { data: employees = [] } = useEmployees();
  const { data: currentEmployee } = useCurrentEmployee(user?.id);
  const companyId = currentEmployee?.company_id;
  const { data: tasks = [] } = useTasks();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: payrollRecords = [] } = usePayrollRecords();

  const pendingLeave = leaveRequests.filter(r => r.status === 'pending').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const pendingPayroll = payrollRecords.filter(p => p.status === 'pending').length;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/');
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
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
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-accent-foreground" />
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
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
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
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="employees" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 hidden sm:inline" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="departments" className="text-xs sm:text-sm">
              <FolderOpen className="h-4 w-4 mr-1 hidden sm:inline" />
              Depts
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-xs sm:text-sm">
              <MapPin className="h-4 w-4 mr-1 hidden sm:inline" />
              Offices
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
              Pay
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="mt-4">
            <EmployeeManagement />
          </TabsContent>
          
          <TabsContent value="departments" className="mt-4">
            <DepartmentManagement />
          </TabsContent>
          
          <TabsContent value="locations" className="mt-4">
            <OfficeLocationManagement companyId={companyId || undefined} />
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
