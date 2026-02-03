import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteStaffRequest {
  userId: string;
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
        JSON.stringify({ error: "Only owners can delete staff accounts" }),
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

    // Parse request body
    const body: DeleteStaffRequest = await req.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-deletion
    if (userId === callerId) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for user deletion
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the user belongs to the same tenant
    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from("profiles")
      .select("tenant_id, username, full_name")
      .eq("id", userId)
      .single();

    if (targetProfileError || !targetProfile) {
      console.error("Target profile error:", targetProfileError);
      return new Response(
        JSON.stringify({ error: "Staff member not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetProfile.tenant_id !== tenantId) {
      return new Response(
        JSON.stringify({ error: "You can only delete staff from your own organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deleting staff:", { userId, username: targetProfile.username });

    // Delete user roles first
    const { error: rolesDeleteError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesDeleteError) {
      console.error("Roles delete error:", rolesDeleteError);
      // Continue anyway
    }

    // Delete property access
    const { error: accessDeleteError } = await adminClient
      .from("property_access")
      .delete()
      .eq("user_id", userId);

    if (accessDeleteError) {
      console.error("Property access delete error:", accessDeleteError);
      // Continue anyway
    }

    // Delete profile
    const { error: profileDeleteError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("Profile delete error:", profileDeleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete staff profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Auth user delete error:", authDeleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Staff deleted successfully:", { userId, username: targetProfile.username });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Staff member "${targetProfile.full_name || targetProfile.username}" has been deleted`,
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
