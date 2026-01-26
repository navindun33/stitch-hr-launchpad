-- Create is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- RLS policies for companies
CREATE POLICY "Super admins can manage all companies"
ON public.companies FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view approved companies"
ON public.companies FOR SELECT
USING (status = 'approved');

CREATE POLICY "Anyone can register a company"
ON public.companies FOR INSERT
WITH CHECK (true);

-- RLS policies for departments
CREATE POLICY "Super admins can manage all departments"
ON public.departments FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage their departments"
ON public.departments FOR ALL
USING (
    company_id IN (
        SELECT e.company_id FROM public.employees e
        WHERE e.user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Employees can view their company departments"
ON public.departments FOR SELECT
USING (
    company_id IN (
        SELECT e.company_id FROM public.employees e
        WHERE e.user_id = auth.uid()
    )
);

-- Update triggers for new tables
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();