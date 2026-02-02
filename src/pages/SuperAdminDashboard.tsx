import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  Search,
  AlertTriangle,
  Clock,
  Shield,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  company_id: string | null;
  user_id: string | null;
  work_type: string | null;
  hourly_rate: number;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  
  // New company form
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');

  // Edit company
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyCode, setEditCompanyCode] = useState('');

  // Delete company
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);

  // Edit user
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Employee | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserDepartment, setEditUserDepartment] = useState('');
  const [editUserWorkType, setEditUserWorkType] = useState('office');
  const [editUserRole, setEditUserRole] = useState('employee');

  // Delete user
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserAuthId, setDeleteUserAuthId] = useState<string | null>(null);

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!authLoading && user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .maybeSingle();
        
        setIsSuperAdmin(!!data);
      } else if (!authLoading && !user) {
        navigate('/super-admin-login');
      }
    };
    
    checkSuperAdmin();
  }, [user, authLoading, navigate]);

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch employees for expanded company
  const { data: companyEmployees = [] } = useQuery({
    queryKey: ['company-employees', expandedCompanyId],
    queryFn: async () => {
      if (!expandedCompanyId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', expandedCompanyId)
        .order('name');
      
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!expandedCompanyId,
  });

  // Fetch user roles for employees
  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', expandedCompanyId],
    queryFn: async () => {
      if (!expandedCompanyId || companyEmployees.length === 0) return [];
      const userIds = companyEmployees.filter(e => e.user_id).map(e => e.user_id!);
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: companyEmployees.length > 0,
  });

  // Approve company mutation
  const approveCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from('companies')
        .update({ 
          status: 'approved', 
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve company');
    },
  });

  // Reject company mutation
  const rejectCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'rejected' })
        .eq('id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company rejected');
    },
    onError: () => {
      toast.error('Failed to reject company');
    },
  });

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async ({ id, name, code }: { id: string; name: string; code: string }) => {
      const { error } = await supabase
        .from('companies')
        .update({ name, code: code.toLowerCase().replace(/\s+/g, '-') })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated successfully');
      setIsEditCompanyOpen(false);
      setEditingCompany(null);
    },
    onError: () => {
      toast.error('Failed to update company');
    },
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      // First delete all employees in the company
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id')
        .eq('company_id', companyId);
      
      // Delete associated auth users via edge function
      if (employees) {
        for (const emp of employees) {
          if (emp.user_id) {
            await supabase.functions.invoke('delete-user', {
              body: { user_id: emp.user_id },
            });
          }
        }
      }

      // Delete the company (this will cascade delete employees due to FK)
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully');
      setDeleteCompanyId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete company');
    },
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      email, 
      department, 
      work_type,
      user_id,
      newRole 
    }: { 
      id: string; 
      name: string; 
      email: string; 
      department: string;
      work_type: string;
      user_id: string | null;
      newRole: string;
    }) => {
      // Update employee
      const { error: empError } = await supabase
        .from('employees')
        .update({ name, email, department, work_type })
        .eq('id', id);
      
      if (empError) throw empError;

      // Update role if user_id exists
      if (user_id) {
        // Remove existing roles (except super_admin)
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user_id)
          .neq('role', 'super_admin');
        
        // Add new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id, role: newRole as 'admin' | 'manager' | 'employee' });
        
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('User updated successfully');
      setIsEditUserOpen(false);
      setEditingUser(null);
    },
    onError: () => {
      toast.error('Failed to update user');
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('User deleted successfully');
      setDeleteUserId(null);
      setDeleteUserAuthId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  // Create company with admin
  const createCompany = useMutation({
    mutationFn: async () => {
      // Create the company first
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          code: companyCode.toLowerCase().replace(/\s+/g, '-'),
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (companyError) throw companyError;

      // Create admin user via edge function
      const { data: adminData, error: adminError } = await supabase.functions.invoke('create-user-with-password', {
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          department: 'Administration',
          company_id: company.id,
          role: 'admin',
        },
      });

      if (adminError || adminData?.error) {
        // Rollback company creation if admin creation fails
        await supabase.from('companies').delete().eq('id', company.id);
        throw new Error(adminData?.error || adminError?.message || 'Failed to create admin user');
      }

      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company and admin created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create company');
    },
  });

  const resetForm = () => {
    setCompanyName('');
    setCompanyCode('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminName('');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/super-admin-login');
  };

  const openEditCompanyDialog = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
    setEditCompanyCode(company.code);
    setIsEditCompanyOpen(true);
  };

  const openEditUserDialog = (employee: Employee) => {
    setEditingUser(employee);
    setEditUserName(employee.name);
    setEditUserEmail(employee.email);
    setEditUserDepartment(employee.department);
    setEditUserWorkType(employee.work_type || 'office');
    
    // Find user's role
    const role = userRoles.find(r => r.user_id === employee.user_id);
    setEditUserRole(role?.role || 'employee');
    
    setIsEditUserOpen(true);
  };

  const getUserRole = (userId: string | null) => {
    if (!userId) return 'No account';
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'employee';
  };

  const pendingCompanies = companies.filter(c => c.status === 'pending');
  const approvedCompanies = companies.filter(c => c.status === 'approved');
  const rejectedCompanies = companies.filter(c => c.status === 'rejected');

  const getFilteredCompanies = () => {
    let filtered: Company[] = [];
    switch (activeTab) {
      case 'pending':
        filtered = pendingCompanies;
        break;
      case 'approved':
        filtered = approvedCompanies;
        break;
      case 'rejected':
        filtered = rejectedCompanies;
        break;
      default:
        filtered = companies;
    }
    
    if (search) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered;
  };

  if (authLoading || isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Access Denied" showBack />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have super admin privileges.
          </p>
          <Button onClick={() => navigate('/')}>Go to Company Login</Button>
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
            <h1 className="text-lg font-bold">Super Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">{pendingCompanies.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Check className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold">{approvedCompanies.length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{companies.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCode">Company Code *</Label>
                  <Input
                    id="companyCode"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    placeholder="acme"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for login (e.g., acme, techcorp)
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Company Admin</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Admin Name *</Label>
                      <Input
                        id="adminName"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@acme.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Admin Password *</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={() => createCompany.mutate()} 
                  disabled={createCompany.isPending || !companyName || !companyCode}
                >
                  {createCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Company
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Companies Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending
              {pendingCompanies.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {pendingCompanies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {companiesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : getFilteredCompanies().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No companies found
                </CardContent>
              </Card>
            ) : (
              getFilteredCompanies().map((company) => (
                <Card key={company.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => setExpandedCompanyId(
                          expandedCompanyId === company.id ? null : company.id
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Code: {company.code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(company.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {company.status === 'approved' && (
                          expandedCompanyId === company.id ? 
                            <ChevronUp className="h-5 w-5 text-muted-foreground" /> :
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {company.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-primary"
                              onClick={() => approveCompany.mutate(company.id)}
                              disabled={approveCompany.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => rejectCompany.mutate(company.id)}
                              disabled={rejectCompany.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {company.status === 'approved' && (
                          <>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Approved
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditCompanyDialog(company)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteCompanyId(company.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {company.status === 'rejected' && (
                          <>
                            <Badge variant="destructive">Rejected</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteCompanyId(company.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Users Section */}
                    {expandedCompanyId === company.id && company.status === 'approved' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Users ({companyEmployees.length})
                          </h4>
                        </div>
                        
                        {companyEmployees.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No users in this company
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {companyEmployees.map((employee) => (
                              <div 
                                key={employee.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{employee.name}</p>
                                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {employee.department}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {getUserRole(employee.user_id)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {employee.work_type || 'office'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditUserDialog(employee)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => {
                                      setDeleteUserId(employee.id);
                                      setDeleteUserAuthId(employee.user_id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Code</Label>
              <Input
                value={editCompanyCode}
                onChange={(e) => setEditCompanyCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCompanyOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingCompany && updateCompany.mutate({
                id: editingCompany.id,
                name: editCompanyName,
                code: editCompanyCode,
              })}
              disabled={updateCompany.isPending}
            >
              {updateCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={editUserDepartment}
                onChange={(e) => setEditUserDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Work Type</Label>
              <Select value={editUserWorkType} onValueChange={setEditUserWorkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingUser && updateEmployee.mutate({
                id: editingUser.id,
                name: editUserName,
                email: editUserEmail,
                department: editUserDepartment,
                work_type: editUserWorkType,
                user_id: editingUser.user_id,
                newRole: editUserRole,
              })}
              disabled={updateEmployee.isPending}
            >
              {updateEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Confirmation */}
      <AlertDialog open={!!deleteCompanyId} onOpenChange={() => setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company and all its users. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCompanyId && deleteCompany.mutate(deleteCompanyId)}
            >
              {deleteCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => { setDeleteUserId(null); setDeleteUserAuthId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user and their account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUserAuthId && deleteUser.mutate({ userId: deleteUserAuthId })}
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
