import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, MapPin, Send, AlertCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useOfficeLocations, useActiveAttendance, useClockIn, useClockOut } from '@/hooks/useAttendance';
import { useMyPendingRequest, useCreateRemoteRequest } from '@/hooks/useRemoteClockIn';
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

interface ClockInOutCardProps {
  employeeId?: string;
  supervisorId?: string;
}

export function ClockInOutCard({ employeeId, supervisorId }: ClockInOutCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showRemoteDialog, setShowRemoteDialog] = useState(false);
  const [remoteReason, setRemoteReason] = useState('');
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  const { getCurrentPosition, calculateDistance, loading: geoLoading } = useGeolocation();
  const { data: officeLocations } = useOfficeLocations();
  const { data: activeAttendance, isLoading: attendanceLoading } = useActiveAttendance(employeeId);
  const { data: pendingRequest } = useMyPendingRequest(employeeId);
  
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const createRemoteRequest = useCreateRemoteRequest();

  const isClockedIn = !!activeAttendance;

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

  const handleClockIn = async () => {
    if (!employeeId) {
      toast.error('Employee not found');
      return;
    }

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
        // Clock in directly
        await clockIn.mutateAsync({
          employeeId,
          latitude: userLat,
          longitude: userLng,
          isRemote: false,
        });
        toast.success('Clocked in successfully!');
      } else {
        // Show remote clock-in dialog
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
                : "You haven't clocked in yet"
              }
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isClockedIn 
              ? 'bg-green-100 text-green-600' 
              : pendingRequest
              ? 'bg-amber-100 text-amber-600'
              : 'bg-muted text-muted-foreground'
          }`}>
            {pendingRequest ? (
              <Send className="h-6 w-6" />
            ) : (
              <Clock className="h-6 w-6" />
            )}
          </div>
        </div>

        {isClockedIn && (
          <div className="text-center mb-4">
            <p className="text-3xl font-bold font-mono text-primary">{formatTime(elapsedTime)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {activeAttendance?.is_remote ? 'Remote' : 'On-site'}
            </p>
          </div>
        )}

        {pendingRequest && !isClockedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Request Pending</p>
              <p className="text-xs text-amber-600">Waiting for supervisor approval</p>
            </div>
          </div>
        )}

        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={isLoading || (!!pendingRequest && !isClockedIn)}
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
