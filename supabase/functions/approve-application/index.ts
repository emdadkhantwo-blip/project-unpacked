import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Claims validation error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Check if user is superadmin using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "superadmin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("Role check error:", roleError, "roleData:", roleData);
      return new Response(
        JSON.stringify({ error: "Only superadmins can approve applications" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User is superadmin, proceeding with approval");

    // Get the application ID and plan ID from request body
    const { applicationId, planId } = await req.json();
    
    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "Application ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!planId) {
      return new Response(
        JSON.stringify({ error: "Plan ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Approving application:", applicationId, "with plan:", planId);

    // Verify plan exists
    const { data: plan, error: planError } = await adminClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error("Plan fetch error:", planError);
      return new Response(
        JSON.stringify({ error: "Invalid plan selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Selected plan:", plan.name);

    // Fetch the application
    const { data: application, error: appError } = await adminClient
      .from("admin_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Application fetch error:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (application.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Application has already been processed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate internal email for auth
    const slug = application.hotel_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const internalEmail = `${application.username}@${slug}.hotel.local`;

    console.log("Creating auth user with email:", internalEmail);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: internalEmail,
      password: application.password,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
        username: application.username,
      },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user.id;
    console.log("Created auth user:", newUserId);

    // Step 2: Create tenant with unique slug (use timestamp to ensure uniqueness)
    const timestamp = Date.now().toString(36);
    const tenantSlug = `${slug}-${timestamp}`;
    
    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        name: application.hotel_name,
        slug: tenantSlug,
        contact_email: application.email,
        contact_phone: application.phone,
        logo_url: application.logo_url,
        status: "active",
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Tenant creation error:", tenantError);
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to create tenant: ${tenantError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Created tenant:", tenant.id, "with slug:", tenantSlug);

    // Step 3: Create subscription with selected plan
    const { error: subscriptionError } = await adminClient
      .from("subscriptions")
      .insert({
        tenant_id: tenant.id,
        plan_id: planId,
        status: "active",
        started_at: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      // Continue anyway, can be fixed manually
    } else {
      console.log("Created subscription with plan:", plan.name);
    }

    // Step 4: Update profile (upsert since handle_new_user trigger may have created it)
    // First, delete any auto-created tenant/profile from the trigger
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("tenant_id")
      .eq("id", newUserId)
      .maybeSingle();

    if (existingProfile?.tenant_id && existingProfile.tenant_id !== tenant.id) {
      // Clean up auto-created tenant from trigger
      console.log("Cleaning up auto-created tenant:", existingProfile.tenant_id);
      await adminClient.from("property_access").delete().eq("user_id", newUserId);
      await adminClient.from("properties").delete().eq("tenant_id", existingProfile.tenant_id);
      await adminClient.from("subscriptions").delete().eq("tenant_id", existingProfile.tenant_id);
      await adminClient.from("tenants").delete().eq("id", existingProfile.tenant_id);
    }

    // Update the profile with correct tenant and both emails
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: newUserId,
        username: application.username,
        email: application.email,           // Public contact email
        auth_email: internalEmail,          // Internal auth email for login
        full_name: application.full_name,
        phone: application.phone,
        tenant_id: tenant.id,
        is_active: true,
        must_change_password: false,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Rollback
      await adminClient.from("subscriptions").delete().eq("tenant_id", tenant.id);
      await adminClient.from("tenants").delete().eq("id", tenant.id);
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Created profile");

    // Step 5: Assign owner role
    const { error: roleAssignError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "owner",
      });

    if (roleAssignError) {
      console.error("Role assignment error:", roleAssignError);
      // Continue anyway, can be fixed manually
    }

    console.log("Assigned owner role");

    // Step 6: Create default property
    const { data: property, error: propertyError } = await adminClient
      .from("properties")
      .insert({
        tenant_id: tenant.id,
        name: application.hotel_name,
        code: "MAIN",
        email: application.email,
        phone: application.phone,
        status: "active",
      })
      .select()
      .single();

    if (propertyError) {
      console.error("Property creation error:", propertyError);
      // Continue anyway
    } else {
      console.log("Created property:", property.id);

      // Step 7: Grant property access
      const { error: accessError } = await adminClient
        .from("property_access")
        .insert({
          user_id: newUserId,
          property_id: property.id,
        });

      if (accessError) {
        console.error("Property access error:", accessError);
      }
    }

    // Step 8: Initialize feature flags for tenant
    const featureFlags = ['pms', 'crm', 'pos'];
    for (const feature of featureFlags) {
      await adminClient.from("feature_flags").insert({
        tenant_id: tenant.id,
        feature_name: feature,
        is_enabled: true,
      });
    }
    console.log("Initialized feature flags");

    // Step 9: Update application status
    const { error: updateError } = await adminClient
      .from("admin_applications")
      .update({
        status: "approved",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Application update error:", updateError);
    }

    console.log("Application approved successfully with", plan.name, "plan");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Application approved successfully",
        userId: newUserId,
        tenantId: tenant.id,
        planName: plan.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
