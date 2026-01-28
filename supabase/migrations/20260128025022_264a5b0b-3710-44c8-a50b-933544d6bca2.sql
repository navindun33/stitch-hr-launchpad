-- Add work_type to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS work_type text DEFAULT 'office';

-- Add company_id to office_locations for multi-tenant support
ALTER TABLE public.office_locations ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Drop existing overly permissive policies on employees
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;

-- Create company-scoped employee viewing policy
CREATE POLICY "Users can view employees in their company"
ON public.employees
FOR SELECT
USING (
  company_id IN (
    SELECT e.company_id FROM employees e WHERE e.user_id = auth.uid()
  )
  OR is_super_admin(auth.uid())
);

-- Update office_locations RLS policies
DROP POLICY IF EXISTS "Anyone can view office locations" ON public.office_locations;

CREATE POLICY "Users can view their company office locations"
ON public.office_locations
FOR SELECT
USING (
  company_id IN (
    SELECT e.company_id FROM employees e WHERE e.user_id = auth.uid()
  )
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Admins can manage their company office locations"
ON public.office_locations
FOR ALL
USING (
  (company_id IN (
    SELECT e.company_id FROM employees e WHERE e.user_id = auth.uid()
  ) AND has_role(auth.uid(), 'admin'))
  OR is_super_admin(auth.uid())
);

-- Update attendance_records to be company-scoped
DROP POLICY IF EXISTS "Employees can view own attendance" ON public.attendance_records;

CREATE POLICY "Users can view attendance in their company"
ON public.attendance_records
FOR SELECT
USING (
  employee_id IN (
    SELECT e.id FROM employees e 
    WHERE e.company_id IN (
      SELECT emp.company_id FROM employees emp WHERE emp.user_id = auth.uid()
    )
  )
  OR is_super_admin(auth.uid())
);