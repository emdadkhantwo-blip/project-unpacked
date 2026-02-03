import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateStaffRequest {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  email?: string;
  roles: string[];
  propertyIds: string[];
  mustChangePassword?: boolean;
  // New HR fields
  staffId?: string;
  departmentId?: string;
  joinDate?: string;
  employmentType?: string;
  salaryAmount?: number;
  salaryCurrency?: string;
  notes?: string;
  // Identity & Banking fields
  nidNumber?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header to verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with caller's token to verify permissions
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the caller's JWT and get their claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Check if caller is owner or superadmin
    const { data: callerRoles, error: rolesError } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    if (rolesError) {
      console.error("Roles fetch error:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roles = callerRoles?.map((r) => r.role) || [];
    const isAuthorized = roles.includes("owner") || roles.includes("superadmin");

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Only owners can create staff accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's tenant_id
    const { data: callerProfile, error: profileError } = await callerClient
      .from("profiles")
      .select("tenant_id")
      .eq("id", callerId)
      .single();

    if (profileError || !callerProfile?.tenant_id) {
      console.error("Profile error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to get tenant information" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = callerProfile.tenant_id;

    // Get tenant slug for email generation
    const { data: tenantData, error: tenantError } = await callerClient
      .from("tenants")
      .select("slug")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenantData) {
      console.error("Tenant error:", tenantError);
      return new Response(
        JSON.stringify({ error: "Failed to get tenant data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateStaffRequest = await req.json();
    const { 
      username, 
      password, 
      fullName, 
      phone, 
      email,
      roles: staffRoles, 
      propertyIds, 
      mustChangePassword = true,
      // New HR fields
      staffId,
      departmentId,
      joinDate,
      employmentType = "full_time",
      salaryAmount,
      salaryCurrency = "BDT",
      notes,
      // Identity & Banking fields
      nidNumber,
      bankAccountNumber,
      bankAccountName,
    } = body;

    // Validate required fields
    if (!username || !password || !fullName || !staffRoles?.length || !propertyIds?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: username, password, fullName, roles, propertyIds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: "Username must be 3-50 characters, alphanumeric and underscores only" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for user creation
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Generate email for the user based on username and tenant slug
    const generatedEmail = `${username}@${tenantData.slug}.hotel.local`;

    // Check if username already exists in this tenant
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Username already exists in this tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating user with email:", generatedEmail);

    // Create the user in auth.users
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: generatedEmail,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: username,
        full_name: fullName,
        tenant_id: tenantId,
      },
    });

    if (authError || !authUser?.user) {
      console.error("Auth user creation error:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authUser.user.id;
    console.log("Created auth user:", newUserId);

    // The handle_new_user trigger will create default profile/tenant, but we need to update it
    // Wait a moment for trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update the profile to set correct tenant_id and other fields
    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        tenant_id: tenantId,
        username: username,
        full_name: fullName,
        phone: phone || null,
        email: email || generatedEmail,
        auth_email: generatedEmail,
        is_active: true,
        must_change_password: mustChangePassword,
      })
      .eq("id", newUserId);

    if (updateProfileError) {
      console.error("Profile update error:", updateProfileError);
      // Try to clean up the auth user
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "Failed to create staff profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate staff_id if not provided
    let finalStaffId = staffId;
    if (!finalStaffId) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      finalStaffId = `STF-${year}-${randomNum}`;
    }

    // Create hr_staff_profiles record
    const { error: hrProfileError } = await adminClient
      .from("hr_staff_profiles")
      .insert({
        tenant_id: tenantId,
        profile_id: newUserId,
        staff_id: finalStaffId,
        department_id: departmentId || null,
        join_date: joinDate || new Date().toISOString().split("T")[0],
        employment_type: employmentType,
        salary_amount: salaryAmount || 0,
        salary_currency: salaryCurrency,
        notes: notes || null,
        // Identity & Banking fields
        nid_number: nidNumber || null,
        bank_account: bankAccountNumber || null,
        bank_name: bankAccountName || null,
      });

    if (hrProfileError) {
      console.error("HR profile creation error:", hrProfileError);
      // Don't fail - profile was created, HR data can be added later
    }

    // Delete any default roles created by trigger and insert the correct ones
    await adminClient.from("user_roles").delete().eq("user_id", newUserId);

    const roleInserts = staffRoles.map((role) => ({
      user_id: newUserId,
      role: role,
    }));

    const { error: rolesInsertError } = await adminClient.from("user_roles").insert(roleInserts);

    if (rolesInsertError) {
      console.error("Roles insert error:", rolesInsertError);
      // Continue anyway, admin can fix roles later
    }

    // Delete any default property access and insert the correct ones
    await adminClient.from("property_access").delete().eq("user_id", newUserId);

    const propertyInserts = propertyIds.map((propertyId) => ({
      user_id: newUserId,
      property_id: propertyId,
    }));

    const { error: propertyInsertError } = await adminClient.from("property_access").insert(propertyInserts);

    if (propertyInsertError) {
      console.error("Property access insert error:", propertyInsertError);
      // Continue anyway, admin can fix access later
    }

    // Clean up any tenant/property that was auto-created by the trigger
    // First find any tenant that was created for this user
    const { data: autoTenant } = await adminClient
      .from("tenants")
      .select("id")
      .eq("slug", `tenant-${newUserId.substring(0, 8)}`)
      .maybeSingle();

    if (autoTenant && autoTenant.id !== tenantId) {
      // Delete the auto-created tenant (cascades to properties)
      await adminClient.from("tenants").delete().eq("id", autoTenant.id);
    }

    console.log("Staff created successfully:", { userId: newUserId, username, roles: staffRoles, staffId: finalStaffId });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUserId,
          username: username,
          email: generatedEmail,
          fullName: fullName,
          roles: staffRoles,
          propertyIds: propertyIds,
          staffId: finalStaffId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
