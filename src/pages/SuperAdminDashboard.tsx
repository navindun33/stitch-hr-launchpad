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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
  Shield
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface Company {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // New company form
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');

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

  // Create company with admin
  const createCompany = useMutation({
    mutationFn: async () => {
      // Create the company
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

      // Create admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName }
      });

      if (authError) {
        // If we can't use admin API, create via edge function or regular signup
        // For now, just create the company without the admin
        toast.warning('Company created. Please create admin user manually.');
        return company;
      }

      if (authData.user) {
        // Create employee record
        await supabase.from('employees').insert({
          user_id: authData.user.id,
          name: adminName,
          email: adminEmail,
          department: 'Administration',
          company_id: company.id,
        });

        // Assign admin role
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'admin',
        });
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Code: {company.code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(company.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {company.status === 'pending' && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
                      
                      {company.status === 'approved' && (
                        <Badge className="badge-approved">
                          Approved
                        </Badge>
                      )}
                      
                      {company.status === 'rejected' && (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
