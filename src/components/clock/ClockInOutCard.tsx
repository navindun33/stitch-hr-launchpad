import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, MapPin, Send, AlertCircle, Loader2, AlertTriangle, Timer, Home, Briefcase } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useOfficeLocations, useActiveAttendance, useClockIn, useClockOut } from '@/hooks/useAttendance';
import { useMyPendingRequest, useCreateRemoteRequest } from '@/hooks/useRemoteClockIn';
import { useEmployeeShifts, isWithinShift, formatShiftTime, EmployeeShift } from '@/hooks/useShifts';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ClockInOutCardProps {
  employeeId?: string;
  supervisorId?: string;
  workType?: 'office' | 'remote' | 'hybrid';
}

export function ClockInOutCard({ employeeId, supervisorId, workType = 'office' }: ClockInOutCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showRemoteDialog, setShowRemoteDialog] = useState(false);
  const [remoteReason, setRemoteReason] = useState('');
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [shiftValidation, setShiftValidation] = useState<{
    isValid: boolean;
    isLate: boolean;
    hoursRemaining: number;
    message: string;
  } | null>(null);

  const { getCurrentPosition, calculateDistance, loading: geoLoading } = useGeolocation();
  const { data: officeLocations } = useOfficeLocations();
  const { data: activeAttendance, isLoading: attendanceLoading } = useActiveAttendance(employeeId);
  const { data: pendingRequest } = useMyPendingRequest(employeeId);
  const { data: shifts = [] } = useEmployeeShifts(employeeId);
  
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const createRemoteRequest = useCreateRemoteRequest();

  const isClockedIn = !!activeAttendance;
  const hasShift = shifts.length > 0;
  const activeShift = shifts.find(s => s.is_active);

  // Validate shift status
  useEffect(() => {
    if (activeShift && !isClockedIn) {
      const validation = isWithinShift(activeShift);
      setShiftValidation(validation);
    } else if (isClockedIn && activeShift) {
      // Calculate remaining time when clocked in
      const now = new Date();
      const [endHour, endMin] = activeShift.shift_end.split(':').map(Number);
      const shiftEnd = new Date(now);
      shiftEnd.setHours(endHour, endMin, 0, 0);
      
      const hoursRemaining = Math.max(0, (shiftEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      setShiftValidation({
        isValid: true,
        isLate: false,
        hoursRemaining,
        message: 'Currently working'
      });
    } else {
      setShiftValidation(null);
    }
  }, [activeShift, isClockedIn]);

  // Update hours remaining every minute when clocked in
  useEffect(() => {
    if (!isClockedIn || !activeShift) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const [endHour, endMin] = activeShift.shift_end.split(':').map(Number);
      const shiftEnd = new Date(now);
      shiftEnd.setHours(endHour, endMin, 0, 0);
      
      const hoursRemaining = Math.max(0, (shiftEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      setShiftValidation(prev => prev ? { ...prev, hoursRemaining } : null);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isClockedIn, activeShift]);

  // Calculate elapsed time
  useEffect(() => {
    if (!activeAttendance) {
      setElapsedTime(0);
      return;
    }

    const clockInTime = new Date(activeAttendance.clock_in_time).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - clockInTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [activeAttendance]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHoursMinutes = (hours: number) => {
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const handleClockIn = async () => {
    if (!employeeId) {
      toast.error('Employee not found');
      return;
    }

    // Check shift validation if employee has a shift assigned
    if (hasShift && shiftValidation) {
      if (!shiftValidation.isValid) {
        toast.error(shiftValidation.message);
        return;
      }
      if (shiftValidation.isLate) {
        toast.warning('Late Clock In - You are more than 2 hours late', {
          duration: 5000,
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
        });
      }
    }

    // Remote employees can clock in directly without location validation
    if (workType === 'remote') {
      try {
        await clockIn.mutateAsync({
          employeeId,
          isRemote: true,
        });
        toast.success('Clocked in successfully (Remote)!');
      } catch (error) {
        toast.error('Failed to clock in');
      }
      return;
    }

    // Office and hybrid employees need location validation
    setIsCheckingLocation(true);

    try {
      const position = await getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Check if within any office location
      let isWithinOffice = false;
      
      if (officeLocations && officeLocations.length > 0) {
        for (const office of officeLocations) {
          const distance = calculateDistance(
            userLat,
            userLng,
            Number(office.latitude),
            Number(office.longitude)
          );
          
          if (distance <= office.radius_meters) {
            isWithinOffice = true;
            break;
          }
        }
      }

      if (isWithinOffice) {
        // Clock in directly at office
        await clockIn.mutateAsync({
          employeeId,
          latitude: userLat,
          longitude: userLng,
          isRemote: false,
        });
        toast.success('Clocked in successfully!');
      } else {
        // Not within office radius - show WFH request dialog
        setShowRemoteDialog(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleRemoteRequest = async () => {
    if (!employeeId || !supervisorId) {
      toast.error('Cannot send request - supervisor not assigned');
      return;
    }

    try {
      const position = await getCurrentPosition();
      
      await createRemoteRequest.mutateAsync({
        employeeId,
        supervisorId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        reason: remoteReason || undefined,
      });

      toast.success('Remote clock-in request sent to supervisor');
      setShowRemoteDialog(false);
      setRemoteReason('');
    } catch (error) {
      toast.error('Failed to send remote request');
    }
  };

  const handleClockOut = async () => {
    if (!activeAttendance) return;

    try {
      const position = await getCurrentPosition();
      
      await clockOut.mutateAsync({
        recordId: activeAttendance.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      
      toast.success('Clocked out successfully!');
    } catch (error) {
      // Clock out even without location
      await clockOut.mutateAsync({
        recordId: activeAttendance.id,
      });
      toast.success('Clocked out successfully!');
    }
  };

  const isLoading = attendanceLoading || geoLoading || isCheckingLocation || clockIn.isPending || clockOut.isPending;

  const canClockIn = () => {
    if (pendingRequest && !isClockedIn) return false;
    if (hasShift && shiftValidation && !shiftValidation.isValid) return false;
    return true;
  };

  return (
    <>
      <div className="bg-card rounded-xl p-4 card-shadow border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Today's Shift</h2>
            <p className="text-muted-foreground text-sm">
              {isClockedIn && activeAttendance
                ? `Clocked in at ${new Date(activeAttendance.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : pendingRequest
                ? 'Remote request pending approval'
                : hasShift && activeShift
                ? `${formatShiftTime(activeShift.shift_start)} - ${formatShiftTime(activeShift.shift_end)}`
                : "No shift assigned - flexible hours"
              }
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isClockedIn 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' 
              : pendingRequest
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {pendingRequest ? (
              <Send className="h-6 w-6" />
            ) : (
              <Clock className="h-6 w-6" />
            )}
          </div>
        </div>

        {/* Shift Status Badge */}
        {hasShift && !isClockedIn && shiftValidation && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            shiftValidation.isValid 
              ? shiftValidation.isLate 
                ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
              : 'bg-destructive/10 border border-destructive/30'
          }`}>
            {shiftValidation.isValid ? (
              shiftValidation.isLate ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Late Clock In Warning</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">You are more than 2 hours late for your shift</p>
                  </div>
                </>
              ) : (
                <>
                  <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Ready to Clock In</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">You're within your shift window</p>
                  </div>
                </>
              )
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Cannot Clock In</p>
                  <p className="text-xs text-destructive/80">{shiftValidation.message}</p>
                </div>
              </>
            )}
          </div>
        )}

        {isClockedIn && (
          <div className="text-center mb-4">
            <p className="text-3xl font-bold font-mono text-primary">{formatTime(elapsedTime)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {activeAttendance?.is_remote ? 'Remote' : 'On-site'}
            </p>
            {hasShift && shiftValidation && shiftValidation.hoursRemaining > 0 && (
              <Badge variant="outline" className="mt-2 gap-1">
                <Timer className="h-3 w-3" />
                {formatHoursMinutes(shiftValidation.hoursRemaining)} remaining
              </Badge>
            )}
          </div>
        )}

        {pendingRequest && !isClockedIn && (
          <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Request Pending</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Waiting for supervisor approval</p>
            </div>
          </div>
        )}

        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={isLoading || !canClockIn()}
          className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isClockedIn 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isCheckingLocation ? 'Checking location...' : 'Processing...'}
            </>
          ) : isClockedIn ? (
            <>
              <LogOut className="h-5 w-5" />
              Clock Out
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Clock In
            </>
          )}
        </button>
      </div>

      <Dialog open={showRemoteDialog} onOpenChange={setShowRemoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              You're Outside Office Range
            </DialogTitle>
            <DialogDescription>
              You're not within 50 meters of the office. Would you like to send a remote clock-in request to your supervisor?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
              <Textarea
                placeholder="E.g., Working from home today, client meeting..."
                value={remoteReason}
                onChange={(e) => setRemoteReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRemoteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRemoteRequest}
              disabled={createRemoteRequest.isPending || !supervisorId}
            >
              {createRemoteRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
