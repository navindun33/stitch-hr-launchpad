
-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Admins and managers can manage all tasks"
ON public.tasks
FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view assigned tasks"
ON public.tasks
FOR SELECT
USING (
    assigned_to IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Employees can update their assigned tasks"
ON public.tasks
FOR UPDATE
USING (
    assigned_to IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for leave_requests
CREATE POLICY "Admins and managers can manage all leave requests"
ON public.leave_requests
FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own leave requests"
ON public.leave_requests
FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Employees can create leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (
    employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
);

-- Create payroll_records table
CREATE TABLE public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    hours_worked NUMERIC NOT NULL DEFAULT 0,
    hourly_rate NUMERIC NOT NULL,
    gross_pay NUMERIC NOT NULL,
    deductions NUMERIC NOT NULL DEFAULT 0,
    net_pay NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payroll_records
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_records
CREATE POLICY "Admins can manage all payroll records"
ON public.payroll_records
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view own payroll records"
ON public.payroll_records
FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
);

-- Create leave_balances table
CREATE TABLE public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL UNIQUE,
    annual_leave NUMERIC NOT NULL DEFAULT 20,
    sick_leave NUMERIC NOT NULL DEFAULT 10,
    personal_leave NUMERIC NOT NULL DEFAULT 5,
    annual_used NUMERIC NOT NULL DEFAULT 0,
    sick_used NUMERIC NOT NULL DEFAULT 0,
    personal_used NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on leave_balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for leave_balances
CREATE POLICY "Admins can manage all leave balances"
ON public.leave_balances
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view own leave balance"
ON public.leave_balances
FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
);

-- Add triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
BEFORE UPDATE ON public.payroll_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON public.leave_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update employees table to allow admins to insert
CREATE POLICY "Admins can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any employee
CREATE POLICY "Admins can update all employees"
ON public.employees
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
