import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { History, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { NightAudit } from '@/hooks/useNightAudit';
import { formatCurrency } from '@/lib/currency';

interface NightAuditHistoryProps {
  audits: NightAudit[];
  isLoading: boolean;
  onExportCSV?: () => void;
}

export function NightAuditHistory({ audits, isLoading, onExportCSV }: NightAuditHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getOccupancyTrend = (index: number) => {
    if (index >= audits.length - 1) return null;
    const current = audits[index].occupancy_rate;
    const previous = audits[index + 1].occupancy_rate;
    const diff = current - previous;

    if (Math.abs(diff) < 0.1) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    return diff > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Audit History</CardTitle>
          </div>
          {onExportCSV && audits.length > 0 && (
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
          )}
        </div>
        <CardDescription>Past night audit records and statistics (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {audits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audit history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Occupancy</TableHead>
                  <TableHead className="text-right">Room Revenue</TableHead>
                  <TableHead className="text-right">F&B Revenue</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">ADR</TableHead>
                  <TableHead className="text-right">RevPAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit, index) => {
                  const totalRevenue = audit.total_room_revenue + audit.total_fb_revenue + audit.total_other_revenue;
                  return (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">
                        {format(new Date(audit.business_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{audit.occupancy_rate.toFixed(1)}%</span>
                          {getOccupancyTrend(index)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(audit.total_room_revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(audit.total_fb_revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(audit.total_other_revenue)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(audit.adr)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(audit.revpar)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
