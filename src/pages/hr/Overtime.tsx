import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Timer, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOvertime } from '@/hooks/useOvertime';
import { AddOvertimeDialog } from '@/components/hr/AddOvertimeDialog';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

const HROvertime = () => {
  const { entries, stats, staffList, isLoading, addEntry, approveEntry, rejectEntry } = useOvertime();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-vibrant-amber text-vibrant-amber">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-vibrant-green/10 text-vibrant-green border-vibrant-green">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRateBadge = (rate: number) => {
    if (rate === 1.5) return <Badge variant="outline">1.5x Weekday</Badge>;
    if (rate === 2) return <Badge variant="outline" className="border-vibrant-blue text-vibrant-blue">2x Weekend</Badge>;
    if (rate === 2.5) return <Badge variant="outline" className="border-vibrant-purple text-vibrant-purple">2.5x Holiday</Badge>;
    return <Badge variant="outline">{rate}x</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-orange/10 to-vibrant-amber/10 border-l-4 border-l-vibrant-orange">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-vibrant-orange" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Hours</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : `${stats.approvedHours}h`}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total OT Cost</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : formatCurrency(stats.totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : `${stats.thisMonthHours}h`}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4 text-vibrant-orange" />
            Overtime Rate Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Weekday OT</span>
                <Badge variant="outline">1.5x</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Regular overtime rate</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Weekend OT</span>
                <Badge variant="outline">2.0x</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Saturday & Sunday</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Holiday OT</span>
                <Badge variant="outline">2.5x</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Public holidays</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-vibrant-orange" />
              Overtime Entries
            </CardTitle>
            <AddOvertimeDialog
              staffList={staffList}
              onSubmit={(data) => addEntry.mutate(data)}
              isSubmitting={addEntry.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Timer className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No overtime entries</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Click "Add Entry" to log overtime hours for employees.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Estimated Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <span className="font-medium text-sm">{entry.staff_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(entry.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{entry.hours}h</TableCell>
                      <TableCell>{getRateBadge(entry.rate_multiplier)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(entry.total_pay)}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="text-right">
                        {entry.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-vibrant-green border-vibrant-green hover:bg-vibrant-green hover:text-white"
                              onClick={() => approveEntry.mutate(entry.id)}
                              disabled={approveEntry.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-vibrant-rose border-vibrant-rose hover:bg-vibrant-rose hover:text-white"
                              onClick={() => rejectEntry.mutate(entry.id)}
                              disabled={rejectEntry.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {entry.status !== 'pending' && entry.approver_name && (
                          <span className="text-xs text-muted-foreground">
                            by {entry.approver_name}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HROvertime;
