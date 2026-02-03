const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  voided: boolean;
  folio_id: string;
  folio_number: string;
  guest_name: string;
  reservation_id: string | null;
  confirmation_number: string | null;
}

interface StatementRequest {
  accountId: string;
  companyName: string;
  accountCode: string;
  contactEmail: string;
  contactName: string | null;
  paymentTerms: string | null;
  billingAddress: string | null;
  currentBalance: number;
  creditLimit: number;
  totalBilled: number;
  totalVoided: number;
  payments: Payment[];
  startDate: string;
  endDate: string;
  hotelName: string;
}

async function sendEmail(to: string, subject: string, html: string, fromName: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${fromName} <onboarding@resend.dev>`,
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

const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: StatementRequest = await req.json();
    
    console.log("Sending corporate statement email to:", data.contactEmail);

    // Build the payments table rows
    const paymentRows = data.payments.length > 0 
      ? data.payments.map(p => `
          <tr style="${p.voided ? 'color: #dc2626; text-decoration: line-through;' : ''}">
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${formatDate(p.created_at)}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${p.guest_name}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${p.folio_number}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${p.confirmation_number || "-"}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace;">${formatCurrency(p.amount)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No transactions found for this period</td></tr>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Corporate Statement - ${data.companyName}</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <table width="100%" style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
              <tr>
                <td>
                  <div style="font-size: 24px; font-weight: bold; color: #1e40af;">${data.hotelName}</div>
                  <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Corporate Account Statement</div>
                </td>
                <td style="text-align: right;">
                  <div style="font-size: 18px; font-weight: 600; color: #1e40af;">
                    STATEMENT OF ACCOUNT
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Account Info -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${data.companyName}</div>
              <div style="color: #64748b; font-size: 14px; line-height: 1.6;">
                Account Code: ${data.accountCode}<br/>
                ${data.contactName ? `Contact: ${data.contactName}<br/>` : ""}
                ${data.billingAddress ? `Address: ${data.billingAddress}<br/>` : ""}
                Payment Terms: ${data.paymentTerms || "Net 30"}
              </div>
            </div>

            <!-- Date Range -->
            <div style="text-align: center; margin-bottom: 20px; color: #64748b; font-size: 14px;">
              Statement Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}
            </div>
            
            <!-- Transactions Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr>
                  <th style="background: #f1f5f9; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Date</th>
                  <th style="background: #f1f5f9; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Guest</th>
                  <th style="background: #f1f5f9; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Folio #</th>
                  <th style="background: #f1f5f9; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Confirmation</th>
                  <th style="background: #f1f5f9; padding: 12px 8px; text-align: right; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${paymentRows}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <table width="100%">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px;">Total Billed:</td>
                  <td style="padding: 8px 0; font-size: 14px; text-align: right; font-family: monospace;">${formatCurrency(data.totalBilled)}</td>
                </tr>
                ${data.totalVoided > 0 ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #dc2626;">Voided:</td>
                  <td style="padding: 8px 0; font-size: 14px; text-align: right; font-family: monospace; color: #dc2626;">-${formatCurrency(data.totalVoided)}</td>
                </tr>
                ` : ""}
                <tr>
                  <td colspan="2"><hr style="border: none; border-top: 2px solid #3b82f6; margin: 12px 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #1e40af;">Current Balance Due:</td>
                  <td style="padding: 8px 0; font-size: 18px; font-weight: bold; text-align: right; font-family: monospace; color: #1e40af;">${formatCurrency(data.currentBalance)}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
              Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} | ${data.hotelName}
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await sendEmail(
      data.contactEmail,
      `Corporate Statement - ${data.companyName} (${formatDate(data.startDate)} to ${formatDate(data.endDate)})`,
      emailHtml,
      data.hotelName
    );

    console.log("Statement email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-corporate-statement-email function:", errorMessage);
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
