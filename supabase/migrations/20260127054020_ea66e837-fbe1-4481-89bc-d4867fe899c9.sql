-- Add shift management table for employees
CREATE TABLE public.employee_shifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL DEFAULT 'Regular Shift',
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Sunday, 1=Monday, etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on employee_shifts
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_shifts
CREATE POLICY "Admins can manage all shifts"
ON public.employee_shifts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own shifts"
ON public.employee_shifts
FOR SELECT
USING (employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
));

-- Add parent_id to tasks table for subtask hierarchy
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create index for faster subtask queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON public.tasks(parent_id);

-- Trigger for updated_at on employee_shifts
CREATE TRIGGER update_employee_shifts_updated_at
BEFORE UPDATE ON public.employee_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();