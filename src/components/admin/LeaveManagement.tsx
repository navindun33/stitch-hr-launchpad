import { useState } from 'react';
import { useLeaveRequests, useRespondToLeaveRequest, LeaveRequest } from '@/hooks/useLeave';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Search, Calendar, Check, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const leaveTypeLabels: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  personal: 'Personal Leave',
  unpaid: 'Unpaid Leave',
};

export function LeaveManagement() {
  const { user } = useAuth();
  const { data: currentEmployee } = useCurrentEmployee(user?.id);
  const { data: leaveRequests = [], isLoading } = useLeaveRequests();
  const respondToLeave = useRespondToLeaveRequest();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
      request.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRespond = async (id: string, status: 'approved' | 'rejected') => {
    if (!currentEmployee) {
      toast.error('Employee profile not found');
      return;
    }

    try {
      await respondToLeave.mutateAsync({
        id,
        status,
        approved_by: currentEmployee.id,
      });
      toast.success(`Leave request ${status}`);
    } catch (error) {
      toast.error('Failed to update leave request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Request List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No leave requests found
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const days = differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1;
            
            return (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.employee?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {request.employee?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{request.employee?.name}</h3>
                        <Badge className={statusColors[request.status]}>{request.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">
                          {leaveTypeLabels[request.leave_type]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </span>
                        <span className="font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                      </div>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      )}
                      {request.approver && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver.name}
                        </p>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => handleRespond(request.id, 'approved')}
                          disabled={respondToLeave.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRespond(request.id, 'rejected')}
                          disabled={respondToLeave.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
