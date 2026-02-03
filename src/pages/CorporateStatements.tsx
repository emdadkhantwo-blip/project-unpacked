import { useState, useRef } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  FileText,
  Download,
  Printer,
  Calendar as CalendarIcon,
  Building2,
  CreditCard,
  Receipt,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useTenant } from "@/hooks/useTenant";
import {
  useCorporateStatements,
  useCorporateAccountsForSelect,
} from "@/hooks/useCorporateStatements";

export default function CorporateStatements() {
  const { tenant } = useTenant();
  const printRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const { data: accounts = [], isLoading: accountsLoading } = useCorporateAccountsForSelect();
  const { data: statementData, isLoading: statementLoading } = useCorporateStatements(
    selectedAccountId,
    startDate,
    endDate
  );

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corporate Statement - ${statementData?.account.company_name || "Statement"}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 40px; 
              color: #1a1a1a;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              border-bottom: 2px solid #3b82f6; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .hotel-info { text-align: left; }
            .hotel-name { font-size: 24px; font-weight: bold; color: #1e40af; }
            .statement-title { 
              font-size: 18px; 
              font-weight: 600; 
              color: #1e40af; 
              text-align: right;
            }
            .account-info { 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px;
              border: 1px solid #e2e8f0;
            }
            .account-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
            .account-details { color: #64748b; font-size: 14px; }
            .date-range { 
              text-align: center; 
              margin-bottom: 20px; 
              color: #64748b; 
              font-size: 14px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
            }
            th { 
              background: #f1f5f9; 
              padding: 12px 8px; 
              text-align: left; 
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #e2e8f0;
            }
            td { 
              padding: 12px 8px; 
              border-bottom: 1px solid #e2e8f0; 
              font-size: 13px;
            }
            .amount { text-align: right; font-family: monospace; }
            .voided { 
              color: #dc2626; 
              text-decoration: line-through; 
            }
            .totals { 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.grand { 
              font-size: 18px; 
              font-weight: bold; 
              border-top: 2px solid #3b82f6;
              padding-top: 16px;
              margin-top: 8px;
              color: #1e40af;
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #94a3b8; 
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hotel-info">
              <div class="hotel-name">${tenant?.name || "Hotel"}</div>
              <div style="color: #64748b; font-size: 12px;">Corporate Account Statement</div>
            </div>
            <div class="statement-title">
              STATEMENT OF ACCOUNT
            </div>
          </div>
          
          <div class="account-info">
            <div class="account-name">${statementData?.account.company_name}</div>
            <div class="account-details">
              Account Code: ${statementData?.account.account_code}<br/>
              ${statementData?.account.contact_name ? `Contact: ${statementData.account.contact_name}<br/>` : ""}
              ${statementData?.account.billing_address ? `Address: ${statementData.account.billing_address}<br/>` : ""}
              Payment Terms: ${statementData?.account.payment_terms || "Net 30"}
            </div>
          </div>

          <div class="date-range">
            Statement Period: ${format(startDate, "MMMM d, yyyy")} - ${format(endDate, "MMMM d, yyyy")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Guest</th>
                <th>Folio #</th>
                <th>Confirmation</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${statementData?.payments.map(p => `
                <tr class="${p.voided ? 'voided' : ''}">
                  <td>${format(new Date(p.created_at), "MMM d, yyyy")}</td>
                  <td>${p.guest_name}</td>
                  <td>${p.folio_number}</td>
                  <td>${p.confirmation_number || "-"}</td>
                  <td class="amount">${formatCurrency(p.amount)}</td>
                </tr>
              `).join("") || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No transactions found</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Total Billed:</span>
              <span>${formatCurrency(statementData?.totals.total_billed || 0)}</span>
            </div>
            ${statementData?.totals.total_voided ? `
            <div class="total-row" style="color: #dc2626;">
              <span>Voided:</span>
              <span>-${formatCurrency(statementData.totals.total_voided)}</span>
            </div>
            ` : ""}
            <div class="total-row grand">
              <span>Current Balance Due:</span>
              <span>${formatCurrency(statementData?.account.current_balance || 0)}</span>
            </div>
          </div>

          <div class="footer">
            Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")} | ${tenant?.name}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    if (!statementData) return;

    const headers = ["Date", "Guest", "Folio #", "Confirmation", "Amount", "Status"];
    const rows = statementData.payments.map((p) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      p.guest_name,
      p.folio_number,
      p.confirmation_number || "",
      p.amount.toString(),
      p.voided ? "Voided" : "Active",
    ]);

    const csvContent = [
      `Corporate Statement - ${statementData.account.company_name}`,
      `Period: ${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      "",
      `Total Billed,,,,"${statementData.totals.total_billed}",`,
      `Current Balance Due,,,,"${statementData.account.current_balance}",`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${statementData.account.account_code}-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statItems = [
    {
      label: "Total Billed",
      value: formatCurrency(statementData?.totals.total_billed || 0),
      icon: Receipt,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Current Balance",
      value: formatCurrency(statementData?.account.current_balance || 0),
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Credit Limit",
      value: formatCurrency(statementData?.account.credit_limit || 0),
      icon: CreditCard,
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Corporate Statements
          </h1>
          <p className="text-muted-foreground mt-1">
            View and export corporate account billing statements
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Account Selector */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Corporate Account</label>
              <Select
                value={selectedAccountId || ""}
                onValueChange={(value) => setSelectedAccountId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{account.company_name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({account.account_code})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Account Selected State */}
      {!selectedAccountId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Select a Corporate Account</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Choose a corporate account from the dropdown above to view their billing statement and transaction history.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {selectedAccountId && statementLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {/* Statement Content */}
      {selectedAccountId && statementData && !statementLoading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statItems.map((item) => (
              <Card
                key={item.label}
                className={cn(
                  "relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
                  `bg-gradient-to-br ${item.gradient}`
                )}
              >
                <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
                <CardContent className="relative z-10 flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-white/20 p-2.5">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    <p className="text-xs text-white/80 font-medium">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handlePrint} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print Statement
            </Button>
          </div>

          {/* Transactions Table */}
          <Card ref={printRef}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b">
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    {statementData.account.company_name}
                  </CardTitle>
                  <CardDescription>
                    Account Code: {statementData.account.account_code} | Payment Terms: {statementData.account.payment_terms}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Date</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Folio #</TableHead>
                      <TableHead>Confirmation</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statementData.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No transactions found for this period</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      statementData.payments.map((payment) => (
                        <TableRow
                          key={payment.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            payment.voided && "opacity-50"
                          )}
                        >
                          <TableCell>
                            {format(new Date(payment.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.guest_name}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {payment.folio_number}
                            </code>
                          </TableCell>
                          <TableCell>
                            {payment.confirmation_number || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.notes || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {payment.voided && (
                                <Badge variant="destructive" className="text-xs">
                                  Voided
                                </Badge>
                              )}
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  payment.voided && "line-through text-muted-foreground"
                                )}
                              >
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Footer */}
              {statementData.payments.length > 0 && (
                <div className="border-t bg-muted/30 p-4">
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Billed:</span>
                        <span className="font-medium">
                          {formatCurrency(statementData.totals.total_billed)}
                        </span>
                      </div>
                      {statementData.totals.total_voided > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>Voided:</span>
                          <span>-{formatCurrency(statementData.totals.total_voided)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Current Balance:</span>
                        <span className="text-primary">
                          {formatCurrency(statementData.account.current_balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
