import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // CRITICAL: Must pass token explicitly when verify_jwt=false
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, name, department, hourly_rate, company_id, role, phone, nic_number, bank_name, bank_account_number, bank_branch, work_type } = await req.json();

    if (!email || !password || !name || !department) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userData.user.id, role: role || 'employee' });

    if (roleError) {
      // Rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: userData.user.id,
        email,
        name,
        department,
        hourly_rate: hourly_rate || 0,
        company_id,
        phone,
        nic_number,
        bank_name,
        bank_account_number,
        bank_branch,
        work_type: work_type || 'office',
      })
      .select()
      .single();

    if (employeeError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: employeeError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userData.user.id, employee_id: employee.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
