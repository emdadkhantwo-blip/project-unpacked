import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Wallet, 
  DollarSign,
  Users,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  CheckCircle,
  Lock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePayroll, PayrollEntry } from '@/hooks/usePayroll';
import { GeneratePayrollDialog } from '@/components/hr/GeneratePayrollDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HRPayroll = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState((currentMonth + 1).toString());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const { 
    periods, 
    isLoading: periodsLoading, 
    usePayrollEntries,
    generatePayroll,
    finalizePayroll,
    calculateTotals,
  } = usePayroll();

  // Find selected period
  useEffect(() => {
    const period = periods.find(
      p => p.month === parseInt(selectedMonth) && p.year === parseInt(selectedYear)
    );
    setSelectedPeriodId(period?.id || null);
  }, [periods, selectedMonth, selectedYear]);

  const { data: entries = [], isLoading: entriesLoading } = usePayrollEntries(selectedPeriodId);
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);
  const totals = calculateTotals(entries);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'processing':
        return <Badge className="bg-vibrant-amber/10 text-vibrant-amber border-vibrant-amber">Processing</Badge>;
      case 'finalized':
        return <Badge className="bg-vibrant-green/10 text-vibrant-green border-vibrant-green">Finalized</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExport = () => {
    if (entries.length === 0) return;
    
    const headers = ['Staff ID', 'Name', 'Department', 'Basic Salary', 'Overtime', 'Gross Pay', 'Net Pay'];
    const rows = entries.map(e => [
      e.staff_id || '-',
      e.staff_name,
      e.department_name || '-',
      e.basic_salary,
      e.overtime_pay,
      e.gross_pay,
      e.net_pay,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${MONTHS[parseInt(selectedMonth) - 1]}-${selectedYear}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalNet)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <Users className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overtime Pay</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalOvertime)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Periods</p>
                <p className="text-2xl font-bold">{periods.length}</p>
              </div>
              <FileText className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Payroll Period:</span>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={month} value={(idx + 1).toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPeriod && getStatusBadge(selectedPeriod.status)}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={entries.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {selectedPeriod && selectedPeriod.status === 'draft' && (
                <Button 
                  variant="outline"
                  onClick={() => finalizePayroll.mutate()}
                  disabled={finalizePayroll.isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Finalize
                </Button>
              )}
              <GeneratePayrollDialog
                onGenerate={() => generatePayroll.mutate()}
                isGenerating={generatePayroll.isPending}
                existingPeriods={periods.map(p => ({ month: p.month, year: p.year }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-vibrant-green" />
            Payroll Summary - {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodsLoading || entriesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No payroll data</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Generate payroll for {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear} to see the summary.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Basic Salary</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.staff_avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {entry.staff_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{entry.staff_name}</p>
                            {entry.staff_id && (
                              <p className="text-xs text-muted-foreground">ID: {entry.staff_id}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{entry.department_name || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(entry.basic_salary)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(entry.overtime_pay)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(entry.gross_pay)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(entry.net_pay)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.totalBasic)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.totalOvertime)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.totalGross)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.totalNet)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRPayroll;
