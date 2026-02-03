import { format, parseISO } from "date-fns";
import { CURRENCY_SYMBOL } from "@/lib/currency";

interface InvoiceData {
  hotelName: string;
  hotelLogo: string | null;
  invoiceNumber: string;
  guestName: string;
  guestPhone: string | null;
  roomNumbers: string[];
  checkInDate: string;
  checkOutDate: string;
  nightsStayed: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
}

const formatAmount = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export function openInvoicePrintView(data: InvoiceData) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  
  if (!printWindow) {
    alert("Please allow popups to download the invoice.");
    return;
  }

  const invoiceDate = format(new Date(), "MMMM d, yyyy");
  const checkInFormatted = format(parseISO(data.checkInDate), "MMMM d, yyyy");
  const checkOutFormatted = format(parseISO(data.checkOutDate), "MMMM d, yyyy");

  const logoHtml = data.hotelLogo
    ? `<img src="${data.hotelLogo}" alt="${data.hotelName}" style="max-height: 60px; max-width: 180px; object-fit: contain;" />`
    : `<div style="font-size: 32px; font-weight: bold; color: #2563eb;">${data.hotelName.charAt(0)}</div>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${data.invoiceNumber}</title>
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

        .bill-to {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
        }

        .guest-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .guest-phone {
          font-size: 14px;
          color: #6b7280;
        }

        .stay-details {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
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

        .charges-table {
          width: 100%;
          border-collapse: collapse;
        }

        .charges-table th {
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

        .charges-table th:last-child {
          text-align: right;
        }

        .charges-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .charges-table td:last-child {
          text-align: right;
          font-weight: 500;
        }

        .charges-table .total-row td {
          border-bottom: none;
          padding-top: 20px;
          font-size: 18px;
          font-weight: bold;
        }

        .charges-table .total-row td:last-child {
          color: #2563eb;
        }

        .charges-table .paid-row td {
          background: #dcfce7;
          color: #166534;
          font-weight: 600;
        }

        .charges-table .paid-row td:last-child {
          color: #166534;
        }

        .charges-table .balance-row td {
          background: #fef2f2;
          color: #991b1b;
          font-weight: 600;
        }

        .charges-table .balance-row td:last-child {
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
          <div class="hotel-name">${data.hotelName}</div>
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <div class="invoice-number">${data.invoiceNumber}</div>
          <div class="invoice-date">${invoiceDate}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Bill To</div>
        <div class="bill-to">
          <div class="guest-name">${data.guestName}</div>
          ${data.guestPhone ? `<div class="guest-phone">${data.guestPhone}</div>` : ""}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Stay Details</div>
        <div class="stay-details">
          <div class="detail-row">
            <span class="detail-label">Room(s)</span>
            <span class="detail-value">${data.roomNumbers.length > 0 ? data.roomNumbers.join(", ") : "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check-in Date</span>
            <span class="detail-value">${checkInFormatted}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check-out Date</span>
            <span class="detail-value">${checkOutFormatted}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration</span>
            <span class="detail-value">${data.nightsStayed} night${data.nightsStayed !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Charges</div>
        <table class="charges-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Charges (Subtotal)</td>
              <td>${formatAmount(data.subtotal)}</td>
            </tr>
            ${data.taxAmount > 0 ? `
            <tr>
              <td>Tax</td>
              <td>${formatAmount(data.taxAmount)}</td>
            </tr>
            ` : ""}
            ${data.serviceCharge > 0 ? `
            <tr>
              <td>Service Charge</td>
              <td>${formatAmount(data.serviceCharge)}</td>
            </tr>
            ` : ""}
            <tr class="total-row">
              <td>Total</td>
              <td>${formatAmount(data.totalAmount)}</td>
            </tr>
            <tr>
              <td>Amount Paid</td>
              <td>${formatAmount(data.paidAmount)}</td>
            </tr>
            <tr class="${data.balance <= 0 ? 'paid-row' : 'balance-row'}">
              <td><strong>${data.balance <= 0 ? 'Payment Status' : 'Balance Due'}</strong></td>
              <td><strong>${data.balance <= 0 ? '✓ PAID IN FULL' : formatAmount(data.balance)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p class="thank-you">Thank you for staying with us!</p>
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
