import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, Users, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyCode: z.string().trim().min(1, 'Company code is required'),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  companyCode: z.string().trim().min(1, 'Company code is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { isAdmin, isAdminOrManager, isLoading: rolesLoading } = useIsAdmin(user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingForRoles, setWaitingForRoles] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCompanyCode, setLoginCompanyCode] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupCompanyCode, setSignupCompanyCode] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Redirect based on role after login
  useEffect(() => {
    if (!loading && user && waitingForRoles && !rolesLoading) {
      if (isAdminOrManager) {
        navigate('/admin');
      } else {
        navigate('/home');
      }
      setWaitingForRoles(false);
    }
  }, [user, loading, rolesLoading, isAdminOrManager, waitingForRoles, navigate]);

  // If already logged in, redirect based on role
  useEffect(() => {
    if (!loading && user && !waitingForRoles) {
      if (!rolesLoading) {
        if (isAdminOrManager) {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
    }
  }, [user, loading, rolesLoading, isAdminOrManager, waitingForRoles, navigate]);

  const validateCompanyCode = async (code: string): Promise<{ id: string } | null> => {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('code', code.toLowerCase())
      .eq('status', 'approved')
      .maybeSingle();
    
    if (error || !data) return null;
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    const result = loginSchema.safeParse({ 
      email: loginEmail, 
      password: loginPassword,
      companyCode: loginCompanyCode 
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setLoginErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    // Validate company code first
    const company = await validateCompanyCode(loginCompanyCode);
    if (!company) {
      setLoginErrors({ companyCode: 'Invalid or unapproved company code' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
      setWaitingForRoles(true);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    const result = signupSchema.safeParse({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      companyCode: signupCompanyCode,
    });
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setSignupErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    // Validate company code first
    const company = await validateCompanyCode(signupCompanyCode);
    if (!company) {
      setSignupErrors({ companyCode: 'Invalid or unapproved company code' });
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await signUp(signupEmail, signupPassword, signupName);
    
    if (error) {
      setIsSubmitting(false);
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Create employee record linked to company
    if (data?.user) {
      await supabase.from('employees').insert({
        user_id: data.user.id,
        name: signupName,
        email: signupEmail,
        department: 'General',
        company_id: company.id,
      });

      // Assign employee role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'employee',
      });
    }

    setIsSubmitting(false);
    toast.success('Account created successfully! Welcome!');
    navigate('/home');
  };

  if (loading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Hira</CardTitle>
          <CardDescription>Sign in to access your company dashboard</CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6" style={{ width: 'calc(100% - 48px)' }}>
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-company">Company Code</Label>
                  <Input
                    id="login-company"
                    type="text"
                    placeholder="e.g., acme"
                    value={loginCompanyCode}
                    onChange={(e) => setLoginCompanyCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {loginErrors.companyCode && (
                    <p className="text-sm text-destructive">{loginErrors.companyCode}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-destructive">{loginErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">{loginErrors.password}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Code</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="e.g., acme"
                    value={signupCompanyCode}
                    onChange={(e) => setSignupCompanyCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {signupErrors.companyCode && (
                    <p className="text-sm text-destructive">{signupErrors.companyCode}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {signupErrors.name && (
                    <p className="text-sm text-destructive">{signupErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-destructive">{signupErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive">{signupErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {signupErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupErrors.confirmPassword}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="px-6 pb-6 pt-2 text-center border-t">
          <Link 
            to="/super-admin-login" 
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <ShieldCheck className="h-4 w-4" />
            Super Admin Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
