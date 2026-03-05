
-- Create a security definer function to get the user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company_id FROM public.employees WHERE user_id = _user_id LIMIT 1
$$;

-- Create a security definer function to get the user's employee_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_employee_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.employees WHERE user_id = _user_id LIMIT 1
$$;

-- Drop the recursive SELECT policy on employees
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;

-- Recreate it using the security definer function
CREATE POLICY "Users can view employees in their company"
ON public.employees FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Fix attendance_records SELECT policy (also has subquery on employees)
DROP POLICY IF EXISTS "Users can view attendance in their company" ON public.attendance_records;
CREATE POLICY "Users can view attendance in their company"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.company_id = get_user_company_id(auth.uid())
  )
  OR is_super_admin(auth.uid())
);

-- Fix office_locations SELECT policy
DROP POLICY IF EXISTS "Users can view their company office locations" ON public.office_locations;
CREATE POLICY "Users can view their company office locations"
ON public.office_locations FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Fix office_locations ALL policy for admins
DROP POLICY IF EXISTS "Admins can manage their company office locations" ON public.office_locations;
CREATE POLICY "Admins can manage their company office locations"
ON public.office_locations FOR ALL
TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  OR is_super_admin(auth.uid())
);
