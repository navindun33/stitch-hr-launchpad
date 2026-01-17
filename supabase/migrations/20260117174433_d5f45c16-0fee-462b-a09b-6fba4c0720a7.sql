-- Create employees table
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    supervisor_id UUID REFERENCES public.employees(id),
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create office locations table for GPS validation
CREATE TABLE public.office_locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_latitude DECIMAL(10,8),
    clock_in_longitude DECIMAL(11,8),
    clock_out_latitude DECIMAL(10,8),
    clock_out_longitude DECIMAL(11,8),
    is_remote BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remote clock-in requests table
CREATE TABLE public.remote_clockin_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.employees(id),
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_clockin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Employees policies (public read for directory, own data for updates)
CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Users can update own employee record" ON public.employees FOR UPDATE USING (auth.uid() = user_id);

-- Office locations policies (public read)
CREATE POLICY "Anyone can view office locations" ON public.office_locations FOR SELECT USING (true);

-- Attendance records policies
CREATE POLICY "Employees can view own attendance" ON public.attendance_records FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can insert own attendance" ON public.attendance_records FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can update own attendance" ON public.attendance_records FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- Remote clock-in requests policies
CREATE POLICY "Employees can view own requests" ON public.remote_clockin_requests FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR supervisor_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can create requests" ON public.remote_clockin_requests FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Supervisors can update requests" ON public.remote_clockin_requests FOR UPDATE USING (
    supervisor_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
    sender_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Receivers can update message read status" ON public.messages FOR UPDATE USING (
    receiver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Insert sample office location
INSERT INTO public.office_locations (name, latitude, longitude, radius_meters)
VALUES ('Main Office', 37.7749, -122.4194, 50);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for employees
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();