import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BillingEmailRequest {
  corporateAccountId: string;
  reservationId: string;
  guestName: string;
  roomNumbers: string;
  checkInDate: string;
  checkOutDate: string;
  billedAmount: number;
  propertyName: string;
  folioNumber: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Hotel Billing <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return res.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      corporateAccountId,
      reservationId,
      guestName,
      roomNumbers,
      checkInDate,
      checkOutDate,
      billedAmount,
      propertyName,
      folioNumber,
    }: BillingEmailRequest = await req.json();

    // Validate required fields
    if (!corporateAccountId || !reservationId) {
      throw new Error("Missing required fields: corporateAccountId and reservationId");
    }

    // Get corporate account details
    const { data: account, error: accountError } = await supabase
      .from("corporate_accounts")
      .select("*")
      .eq("id", corporateAccountId)
      .single();

    if (accountError || !account) {
      throw new Error(`Corporate account not found: ${corporateAccountId}`);
    }

    // Check if contact email exists
    if (!account.contact_email) {
      console.log(`No contact email for corporate account: ${account.company_name}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No contact email configured for corporate account" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format dates
    const formattedCheckIn = new Date(checkInDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedCheckOut = new Date(checkOutDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format currency
    const formattedAmount = new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(billedAmount);

    const formattedBalance = new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(account.current_balance);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${propertyName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Corporate Billing Summary</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0 0 20px 0;">Dear ${account.contact_name || "Valued Partner"},</p>
          
          <p>This is to notify you that a charge has been billed to your corporate account for a recent guest checkout.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #374151;">Checkout Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Guest Name</td>
                <td style="padding: 8px 0; font-weight: 500;">${guestName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Room(s)</td>
                <td style="padding: 8px 0; font-weight: 500;">${roomNumbers}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Check-in</td>
                <td style="padding: 8px 0;">${formattedCheckIn}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Check-out</td>
                <td style="padding: 8px 0;">${formattedCheckOut}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Folio Number</td>
                <td style="padding: 8px 0;">${folioNumber}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #166534;">Billing Summary</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #166534;">Amount Billed</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 18px; text-align: right; color: #166534;">${formattedAmount}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fcd34d;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #92400e;">Account Status</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #92400e;">Account Code</td>
                <td style="padding: 8px 0; font-weight: 500; text-align: right;">${account.account_code}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #92400e;">Current Outstanding Balance</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 18px; text-align: right; color: #92400e;">${formattedBalance}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #92400e;">Payment Terms</td>
                <td style="padding: 8px 0; text-align: right;">${account.payment_terms || "Net 30"}</td>
              </tr>
            </table>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
            If you have any questions about this billing, please contact our accounts department.
          </p>
          
          <p style="margin: 20px 0 0 0;">Thank you for your continued partnership.</p>
          
          <p style="margin: 20px 0 0 0; color: #6b7280;">
            Best regards,<br>
            <strong>${propertyName}</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">This is an automated billing notification.</p>
          <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} ${propertyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await sendEmail(
      account.contact_email,
      `Corporate Billing Summary - ${guestName} Checkout`,
      emailHtml
    );

    console.log("Corporate billing email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-corporate-billing-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
