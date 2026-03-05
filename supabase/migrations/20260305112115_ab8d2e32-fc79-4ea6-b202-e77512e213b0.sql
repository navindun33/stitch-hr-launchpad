
-- Add ON DELETE CASCADE to employees_company_id_fkey so company deletion cascades
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_company_id_fkey;
ALTER TABLE public.employees ADD CONSTRAINT employees_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Also cascade departments when company is deleted
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_company_id_fkey;
ALTER TABLE public.departments ADD CONSTRAINT departments_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Also cascade office_locations when company is deleted
ALTER TABLE public.office_locations DROP CONSTRAINT IF EXISTS office_locations_company_id_fkey;
ALTER TABLE public.office_locations ADD CONSTRAINT office_locations_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Fix remaining RLS policies that do subqueries on employees to use security definer functions

-- Fix leave_requests policies
DROP POLICY IF EXISTS "Employees can create leave requests" ON public.leave_requests;
CREATE POLICY "Employees can create leave requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (employee_id = get_user_employee_id(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own leave requests" ON public.leave_requests;
CREATE POLICY "Employees can view own leave requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (employee_id = get_user_employee_id(auth.uid()));

-- Fix attendance_records policies
DROP POLICY IF EXISTS "Employees can insert own attendance" ON public.attendance_records;
CREATE POLICY "Employees can insert own attendance"
ON public.attendance_records FOR INSERT
TO authenticated
WITH CHECK (employee_id = get_user_employee_id(auth.uid()));

DROP POLICY IF EXISTS "Employees can update own attendance" ON public.attendance_records;
CREATE POLICY "Employees can update own attendance"
ON public.attendance_records FOR UPDATE
TO authenticated
USING (employee_id = get_user_employee_id(auth.uid()));

-- Fix remote_clockin_requests policies
DROP POLICY IF EXISTS "Employees can create requests" ON public.remote_clockin_requests;
CREATE POLICY "Employees can create requests"
ON public.remote_clockin_requests FOR INSERT
TO authenticated
WITH CHECK (employee_id = get_user_employee_id(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own requests" ON public.remote_clockin_requests;
CREATE POLICY "Employees can view own requests"
ON public.remote_clockin_requests FOR SELECT
TO authenticated
USING (
  employee_id = get_user_employee_id(auth.uid())
  OR supervisor_id = get_user_employee_id(auth.uid())
);

DROP POLICY IF EXISTS "Supervisors can update requests" ON public.remote_clockin_requests;
CREATE POLICY "Supervisors can update requests"
ON public.remote_clockin_requests FOR UPDATE
TO authenticated
USING (supervisor_id = get_user_employee_id(auth.uid()));

-- Fix messages policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = get_user_employee_id(auth.uid()));

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  sender_id = get_user_employee_id(auth.uid())
  OR receiver_id = get_user_employee_id(auth.uid())
);

DROP POLICY IF EXISTS "Receivers can update message read status" ON public.messages;
CREATE POLICY "Receivers can update message read status"
ON public.messages FOR UPDATE
TO authenticated
USING (receiver_id = get_user_employee_id(auth.uid()));

-- Fix tasks policies
DROP POLICY IF EXISTS "Employees can update their assigned tasks" ON public.tasks;
CREATE POLICY "Employees can update their assigned tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (assigned_to = get_user_employee_id(auth.uid()));

DROP POLICY IF EXISTS "Employees can view assigned tasks" ON public.tasks;
CREATE POLICY "Employees can view assigned tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (assigned_to = get_user_employee_id(auth.uid()));

-- Fix employee_shifts policies
DROP POLICY IF EXISTS "Employees can view their own shifts" ON public.employee_shifts;
CREATE POLICY "Employees can view their own shifts"
ON public.employee_shifts FOR SELECT
TO authenticated
USING (employee_id = get_user_employee_id(auth.uid()));

-- Fix leave_balances policies
DROP POLICY IF EXISTS "Employees can view own leave balance" ON public.leave_balances;
CREATE POLICY "Employees can view own leave balance"
ON public.leave_balances FOR SELECT
TO authenticated
USING (employee_id = get_user_employee_id(auth.uid()));

-- Fix departments policies
DROP POLICY IF EXISTS "Employees can view their company departments" ON public.departments;
CREATE POLICY "Employees can view their company departments"
ON public.departments FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Company admins can manage their departments" ON public.departments;
CREATE POLICY "Company admins can manage their departments"
ON public.departments FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Fix payroll_records policies
DROP POLICY IF EXISTS "Employees can view own payroll records" ON public.payroll_records;
CREATE POLICY "Employees can view own payroll records"
ON public.payroll_records FOR SELECT
TO authenticated
USING (employee_id = get_user_employee_id(auth.uid()));

-- Fix employees own update policy
DROP POLICY IF EXISTS "Users can update own employee record" ON public.employees;
CREATE POLICY "Users can update own employee record"
ON public.employees FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
