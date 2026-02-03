import { format } from "date-fns";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import type { Folio, FolioItem, Payment } from "@/hooks/useFolios";

interface FolioInvoiceData {
  folio: Folio;
  hotelName: string;
  hotelLogo: string | null;
}

const formatAmount = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatItemType = (type: string): string => {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

export function openFolioInvoicePrintView(data: FolioInvoiceData) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  
  if (!printWindow) {
    alert("Please allow popups to print the invoice.");
    return;
  }

  const { folio, hotelName, hotelLogo } = data;
  const invoiceDate = format(new Date(), "MMMM d, yyyy");
  const guestName = folio.guest ? `${folio.guest.first_name} ${folio.guest.last_name}` : "Guest";
  const guestPhone = folio.guest?.phone || "";
  const guestEmail = folio.guest?.email || "";
  
  const activeItems = folio.folio_items.filter(item => !item.voided);
  const activePayments = folio.payments.filter(p => !p.voided);

  const logoHtml = hotelLogo
    ? `<img src="${hotelLogo}" alt="${hotelName}" style="max-height: 60px; max-width: 180px; object-fit: contain;" />`
    : `<div style="font-size: 32px; font-weight: bold; color: #2563eb;">${hotelName.charAt(0)}</div>`;

  const chargesRowsHtml = activeItems.map(item => `
    <tr>
      <td>${item.description}</td>
      <td>${formatItemType(item.item_type)}</td>
      <td>${format(new Date(item.service_date), "MMM d, yyyy")}</td>
      <td class="amount-cell">${formatAmount(Number(item.total_price))}</td>
    </tr>
  `).join("");

  const paymentsRowsHtml = activePayments.map(payment => `
    <tr>
      <td>${payment.payment_method.replace("_", " ").charAt(0).toUpperCase() + payment.payment_method.replace("_", " ").slice(1)}</td>
      <td>${format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}</td>
      <td>${payment.reference_number || "-"}</td>
      <td class="amount-cell text-success">${formatAmount(Number(payment.amount))}</td>
    </tr>
  `).join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Folio Invoice - ${folio.folio_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #fff;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hotel-name {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }

        .invoice-title {
          text-align: right;
        }

        .invoice-title h1 {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 4px;
        }

        .invoice-number {
          font-size: 14px;
          color: #6b7280;
        }

        .invoice-date {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .section {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .info-box {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .guest-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .guest-contact {
          font-size: 14px;
          color: #6b7280;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #6b7280;
          font-size: 14px;
        }

        .detail-value {
          font-weight: 500;
          color: #111827;
          font-size: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        th {
          text-align: left;
          padding: 12px 16px;
          background: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .amount-cell {
          text-align: right;
          font-weight: 500;
        }

        .text-success {
          color: #16a34a;
        }

        .summary-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }

        .summary-row.total {
          border-top: 2px solid #e5e7eb;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 18px;
          font-weight: bold;
        }

        .summary-row.paid {
          color: #16a34a;
          font-weight: 600;
        }

        .summary-row.balance {
          font-size: 16px;
          font-weight: bold;
        }

        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 16px;
        }

        .status-paid {
          background: #dcfce7;
          color: #166534;
        }

        .status-due {
          background: #fef2f2;
          color: #991b1b;
        }

        .footer {
          margin-top: 60px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .footer p {
          color: #6b7280;
          font-size: 14px;
        }

        .footer .thank-you {
          font-size: 16px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 8px;
        }

        @media print {
          body {
            padding: 20px;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          ${logoHtml}
          <div class="hotel-name">${hotelName}</div>
        </div>
        <div class="invoice-title">
          <h1>FOLIO INVOICE</h1>
          <div class="invoice-number">${folio.folio_number}</div>
          <div class="invoice-date">${invoiceDate}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="section">
          <div class="section-title">Bill To</div>
          <div class="info-box">
            <div class="guest-name">${guestName}</div>
            ${guestPhone ? `<div class="guest-contact">${guestPhone}</div>` : ""}
            ${guestEmail ? `<div class="guest-contact">${guestEmail}</div>` : ""}
          </div>
        </div>

        ${folio.reservation ? `
        <div class="section">
          <div class="section-title">Reservation Details</div>
          <div class="info-box">
            <div class="detail-row">
              <span class="detail-label">Confirmation</span>
              <span class="detail-value">${folio.reservation.confirmation_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in</span>
              <span class="detail-value">${format(new Date(folio.reservation.check_in_date), "MMM d, yyyy")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out</span>
              <span class="detail-value">${format(new Date(folio.reservation.check_out_date), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
        ` : ""}
      </div>

      <div class="section">
        <div class="section-title">Charges (${activeItems.length} items)</div>
        ${activeItems.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Date</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${chargesRowsHtml}
          </tbody>
        </table>
        ` : `<p style="color: #6b7280; text-align: center; padding: 20px;">No charges</p>`}
      </div>

      <div class="section">
        <div class="section-title">Payments (${activePayments.length} records)</div>
        ${activePayments.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Date & Time</th>
              <th>Reference</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsRowsHtml}
          </tbody>
        </table>
        ` : `<p style="color: #6b7280; text-align: center; padding: 20px;">No payments recorded</p>`}
      </div>

      <div class="summary-section">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatAmount(Number(folio.subtotal))}</span>
        </div>
        ${Number(folio.tax_amount) > 0 ? `
        <div class="summary-row">
          <span>Tax</span>
          <span>${formatAmount(Number(folio.tax_amount))}</span>
        </div>
        ` : ""}
        ${Number(folio.service_charge) > 0 ? `
        <div class="summary-row">
          <span>Service Charge</span>
          <span>${formatAmount(Number(folio.service_charge))}</span>
        </div>
        ` : ""}
        <div class="summary-row total">
          <span>Total</span>
          <span>${formatAmount(Number(folio.total_amount))}</span>
        </div>
        <div class="summary-row paid">
          <span>Amount Paid</span>
          <span>${formatAmount(Number(folio.paid_amount))}</span>
        </div>
        <div class="summary-row balance">
          <span>${Number(folio.balance) <= 0 ? "Status" : "Balance Due"}</span>
          <span style="color: ${Number(folio.balance) <= 0 ? '#16a34a' : '#991b1b'};">
            ${Number(folio.balance) <= 0 ? "PAID IN FULL" : formatAmount(Number(folio.balance))}
          </span>
        </div>
      </div>

      <div class="footer">
        <p class="thank-you">Thank you for your stay!</p>
        <p>We hope to see you again soon.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
