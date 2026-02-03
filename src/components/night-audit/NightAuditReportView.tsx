import { format } from 'date-fns';
import { CURRENCY_SYMBOL } from '@/lib/currency';
import type { RoomDetail } from './NightAuditRoomList';
import type { GuestDetail } from './NightAuditGuestList';
import type { PaymentsByMethod, RevenueByCategory } from './NightAuditRevenueBreakdown';

interface AuditStatistics {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  totalPayments: number;
  adr: number;
  revpar: number;
  arrivalsToday: number;
  departuresToday: number;
  stayovers: number;
  noShows: number;
}

interface NightAuditReportData {
  businessDate: string;
  hotelName: string;
  hotelLogo: string | null;
  stats: AuditStatistics;
  rooms: RoomDetail[];
  guests: GuestDetail[];
  paymentsByMethod: PaymentsByMethod;
  revenueByCategory: RevenueByCategory;
  generatedAt: string;
  generatedBy: string;
}

const formatAmount = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export function openNightAuditReportView(data: NightAuditReportData) {
  const printWindow = window.open('', '_blank', 'width=900,height=1100');

  if (!printWindow) {
    alert('Please allow popups to print the report.');
    return;
  }

  const { businessDate, hotelName, hotelLogo, stats, rooms, guests, paymentsByMethod, revenueByCategory, generatedAt, generatedBy } = data;

  const logoHtml = hotelLogo
    ? `<img src="${hotelLogo}" alt="${hotelName}" style="max-height: 60px; max-width: 180px; object-fit: contain;" />`
    : `<div style="font-size: 32px; font-weight: bold; color: #2563eb;">${hotelName.charAt(0)}</div>`;

  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const vipGuests = guests.filter(g => g.is_vip);

  const roomRowsHtml = occupiedRooms.map(room => `
    <tr>
      <td>${room.room_number}</td>
      <td>${room.room_type_name}</td>
      <td>${room.guest_name || '-'}</td>
      <td class="amount-cell">${formatAmount(room.rate_per_night)}</td>
      <td class="amount-cell ${room.balance > 0 ? 'text-danger' : 'text-success'}">
        ${room.balance > 0 ? formatAmount(room.balance) : 'Paid'}
      </td>
    </tr>
  `).join('');

  const paymentMethodsHtml = [
    { label: 'Cash', value: paymentsByMethod.cash },
    { label: 'Credit Card', value: paymentsByMethod.credit_card },
    { label: 'Debit Card', value: paymentsByMethod.debit_card },
    { label: 'Bank Transfer', value: paymentsByMethod.bank_transfer },
    { label: 'Other', value: paymentsByMethod.other },
  ].filter(m => m.value > 0).map(m => `
    <tr>
      <td>${m.label}</td>
      <td class="amount-cell">${formatAmount(m.value)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Night Audit Report - ${format(new Date(businessDate), 'MMMM d, yyyy')}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.5;
          color: #1f2937;
          background: #fff;
          padding: 30px;
          max-width: 900px;
          margin: 0 auto;
          font-size: 12px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #2563eb;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hotel-name {
          font-size: 20px;
          font-weight: bold;
          color: #111827;
        }

        .report-title {
          text-align: right;
        }

        .report-title h1 {
          font-size: 22px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 4px;
        }

        .report-date {
          font-size: 14px;
          color: #4b5563;
          font-weight: 600;
        }

        .report-meta {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }

        .kpi-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #374151;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .stats-box {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
        }

        .stats-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .stats-row:last-child {
          border-bottom: none;
        }

        .stats-label {
          color: #6b7280;
        }

        .stats-value {
          font-weight: 600;
          color: #111827;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 11px;
        }

        th {
          text-align: left;
          padding: 10px 12px;
          background: #f3f4f6;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .amount-cell {
          text-align: right;
          font-weight: 500;
        }

        .text-success {
          color: #16a34a;
        }

        .text-danger {
          color: #dc2626;
        }

        .summary-box {
          background: #2563eb;
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-top: 24px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: center;
        }

        .summary-value {
          font-size: 28px;
          font-weight: bold;
        }

        .summary-label {
          font-size: 11px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 11px;
        }

        .page-break {
          page-break-before: always;
        }

        @media print {
          body {
            padding: 15px;
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
        <div class="report-title">
          <h1>NIGHT AUDIT REPORT</h1>
          <div class="report-date">${format(new Date(businessDate), 'MMMM d, yyyy')}</div>
          <div class="report-meta">Generated: ${generatedAt} by ${generatedBy}</div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">${stats.occupancyRate.toFixed(1)}%</div>
          <div class="kpi-label">Occupancy Rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${formatAmount(stats.adr)}</div>
          <div class="kpi-label">ADR</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${formatAmount(stats.revpar)}</div>
          <div class="kpi-label">RevPAR</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${formatAmount(stats.totalRevenue)}</div>
          <div class="kpi-label">Total Revenue</div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-grid">
        <div class="section">
          <div class="section-title">Occupancy Statistics</div>
          <div class="stats-box">
            <div class="stats-row">
              <span class="stats-label">Total Rooms</span>
              <span class="stats-value">${stats.totalRooms}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Occupied Rooms</span>
              <span class="stats-value">${stats.occupiedRooms}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Vacant Rooms</span>
              <span class="stats-value">${stats.vacantRooms}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Guest Movement</div>
          <div class="stats-box">
            <div class="stats-row">
              <span class="stats-label">Arrivals</span>
              <span class="stats-value" style="color: #16a34a;">${stats.arrivalsToday}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Departures</span>
              <span class="stats-value" style="color: #2563eb;">${stats.departuresToday}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Stayovers</span>
              <span class="stats-value">${stats.stayovers}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">No-Shows</span>
              <span class="stats-value" style="color: #dc2626;">${stats.noShows}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue -->
      <div class="stats-grid">
        <div class="section">
          <div class="section-title">Revenue Breakdown</div>
          <div class="stats-box">
            <div class="stats-row">
              <span class="stats-label">Room Revenue</span>
              <span class="stats-value">${formatAmount(stats.roomRevenue)}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">F&B Revenue</span>
              <span class="stats-value">${formatAmount(stats.fbRevenue)}</span>
            </div>
            <div class="stats-row">
              <span class="stats-label">Other Revenue</span>
              <span class="stats-value">${formatAmount(stats.otherRevenue)}</span>
            </div>
            <div class="stats-row" style="background: #f3f4f6; margin: 8px -16px -16px; padding: 8px 16px; border-radius: 0 0 8px 8px;">
              <span class="stats-label" style="font-weight: 600;">Total Revenue</span>
              <span class="stats-value" style="color: #2563eb;">${formatAmount(stats.totalRevenue)}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payments Received</div>
          <div class="stats-box">
            ${paymentMethodsHtml || '<div class="stats-row"><span class="stats-label">No payments recorded</span></div>'}
            <div class="stats-row" style="background: #f3f4f6; margin: 8px -16px -16px; padding: 8px 16px; border-radius: 0 0 8px 8px;">
              <span class="stats-label" style="font-weight: 600;">Total Payments</span>
              <span class="stats-value" style="color: #16a34a;">${formatAmount(stats.totalPayments)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Occupied Rooms Table -->
      ${occupiedRooms.length > 0 ? `
      <div class="section">
        <div class="section-title">Occupied Rooms (${occupiedRooms.length})</div>
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Guest</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${roomRowsHtml}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- VIP Guests -->
      ${vipGuests.length > 0 ? `
      <div class="section">
        <div class="section-title">VIP Guests (${vipGuests.length})</div>
        <table>
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Room</th>
              <th>Phone</th>
              <th>Check-out</th>
            </tr>
          </thead>
          <tbody>
            ${vipGuests.map(g => `
              <tr>
                <td><strong>${g.first_name} ${g.last_name}</strong></td>
                <td>${g.room_number}</td>
                <td>${g.phone || '-'}</td>
                <td>${format(new Date(g.check_out_date), 'MMM d, yyyy')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Summary -->
      <div class="summary-box">
        <div class="summary-grid">
          <div>
            <div class="summary-value">${stats.occupiedRooms}/${stats.totalRooms}</div>
            <div class="summary-label">Rooms Occupied</div>
          </div>
          <div>
            <div class="summary-value">${guests.length}</div>
            <div class="summary-label">Total Guests</div>
          </div>
          <div>
            <div class="summary-value">${formatAmount(stats.totalRevenue)}</div>
            <div class="summary-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This report was automatically generated by ${hotelName} Night Audit System</p>
        <p>© ${new Date().getFullYear()} ${hotelName}. All rights reserved.</p>
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
