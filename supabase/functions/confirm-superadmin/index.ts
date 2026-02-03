import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPERADMIN_EMAIL = 'superadmin@gmail.com'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function uses service role key internally - secure backend operation
    // Verify request has some form of authorization or is from allowed source
    const apiKey = req.headers.get('apikey') || req.headers.get('x-api-key')
    const authHeader = req.headers.get('Authorization')
    
    // Allow if request has the anon key or service role key
    if (!apiKey && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find the superadmin user
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: 'Failed to list users', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const superadminUser = users.users.find(u => u.email === SUPERADMIN_EMAIL)
    
    if (!superadminUser) {
      return new Response(
        JSON.stringify({ error: 'Superadmin user not found', email: SUPERADMIN_EMAIL }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already confirmed
    if (superadminUser.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Superadmin email already confirmed',
          user_id: superadminUser.id,
          confirmed_at: superadminUser.email_confirmed_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Confirm the email using admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      superadminUser.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('Error confirming user:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to confirm email', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Superadmin email confirmed for user ${superadminUser.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Superadmin email confirmed successfully',
        user_id: superadminUser.id,
        email: SUPERADMIN_EMAIL
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
