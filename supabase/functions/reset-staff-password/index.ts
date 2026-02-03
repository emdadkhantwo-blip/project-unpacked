import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
  mustChangePassword?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Check if caller is owner (only owners can reset passwords)
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
        JSON.stringify({ error: "Only owners can reset staff passwords" }),
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
    const body: ResetPasswordRequest = await req.json();
    const { userId, newPassword, mustChangePassword = true } = body;

    // Validate required fields
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, newPassword" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify target user belongs to same tenant
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("tenant_id, username")
      .eq("id", userId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetProfile.tenant_id !== tenantId) {
      return new Response(
        JSON.stringify({ error: "Cannot reset password for users in different tenant" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password using admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update must_change_password flag
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({ must_change_password: mustChangePassword })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      // Don't fail - password was reset successfully
    }

    console.log("Password reset successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password reset for ${targetProfile.username}`,
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
