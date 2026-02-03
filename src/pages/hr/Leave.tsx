import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CalendarDays, 
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Umbrella,
  Heart,
  Briefcase
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLeaveManagement } from '@/hooks/useLeaveManagement';
import { ApplyLeaveDialog } from '@/components/hr/ApplyLeaveDialog';
import { CreateLeaveTypeDialog } from '@/components/hr/CreateLeaveTypeDialog';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const LEAVE_TYPE_ICONS: Record<string, typeof Umbrella> = {
  annual: Umbrella,
  sick: Heart,
  casual: Calendar,
  unpaid: Briefcase,
};

const HRLeave = () => {
  const { 
    leaveTypes, 
    leaveRequests, 
    stats, 
    isLoading,
    submitRequest,
    approveRequest,
    rejectRequest,
    createLeaveType,
  } = useLeaveManagement();

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

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-vibrant-rose" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave Today</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.onLeaveToday}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-vibrant-purple" />
                Leave Types
              </CardTitle>
              <CreateLeaveTypeDialog 
                onSubmit={(data) => createLeaveType.mutate(data)}
                isSubmitting={createLeaveType.isPending}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : leaveTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leave types configured</p>
              </div>
            ) : (
              leaveTypes.map((type) => {
                const Icon = LEAVE_TYPE_ICONS[type.code.toLowerCase()] || Calendar;
                return (
                  <div 
                    key={type.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${type.color || '#3B82F6'}20` }}
                      >
                        <Icon 
                          className="h-4 w-4" 
                          style={{ color: type.color || '#3B82F6' }}
                        />
                      </div>
                      <span className="font-medium text-sm">{type.name}</span>
                    </div>
                    <Badge variant="outline">{type.days_per_year || 0} days/year</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-vibrant-blue" />
                Leave Requests
              </CardTitle>
              <ApplyLeaveDialog 
                leaveTypes={leaveTypes}
                onSubmit={(data) => submitRequest.mutate(data)}
                isSubmitting={submitRequest.isPending}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No leave requests</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Leave requests will appear here once staff members apply for leave.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={request.staff_avatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {request.staff_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{request.staff_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: request.leave_type_color || '#3B82F6' }}
                            />
                            <span className="text-sm">{request.leave_type_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(request.start_date), 'MMM d')} - {format(parseISO(request.end_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">{request.days}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 text-vibrant-green border-vibrant-green hover:bg-vibrant-green hover:text-white"
                                onClick={() => approveRequest.mutate(request.id)}
                                disabled={approveRequest.isPending}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 text-vibrant-rose border-vibrant-rose hover:bg-vibrant-rose hover:text-white"
                                onClick={() => rejectRequest.mutate({ requestId: request.id })}
                                disabled={rejectRequest.isPending}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
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

      {/* Leave Calendar - Approved Leaves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-vibrant-green" />
            Team on Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.filter(r => r.status === 'approved').length === 0 ? (
            <div className="min-h-[150px] border rounded-lg p-4 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No scheduled leaves to display</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveRequests.filter(r => r.status === 'approved').slice(0, 6).map((request) => (
                <div 
                  key={request.id}
                  className="p-4 rounded-lg border flex items-center gap-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: request.leave_type_color || '#3B82F6' }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.staff_avatar || undefined} />
                    <AvatarFallback>
                      {request.staff_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.staff_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(request.start_date), 'MMM d')} - {format(parseISO(request.end_date), 'MMM d')}
                    </p>
                    <p className="text-xs text-muted-foreground">{request.leave_type_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRLeave;
