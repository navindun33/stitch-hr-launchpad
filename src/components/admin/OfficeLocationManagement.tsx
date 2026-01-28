import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, MapPin, Navigation } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  company_id: string | null;
  created_at: string;
}

interface OfficeLocationManagementProps {
  companyId: string | undefined;
}

export function OfficeLocationManagement({ companyId }: OfficeLocationManagementProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OfficeLocation | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('50');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['office-locations', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_locations')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data as OfficeLocation[];
    },
    enabled: !!companyId,
  });

  const createLocation = useMutation({
    mutationFn: async (locationData: {
      name: string;
      latitude: number;
      longitude: number;
      radius_meters: number;
      company_id: string;
    }) => {
      const { data, error } = await supabase
        .from('office_locations')
        .insert(locationData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-locations'] });
      toast.success('Office location added');
      resetForm();
      setIsCreateOpen(false);
    },
    onError: () => {
      toast.error('Failed to add office location');
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radius_meters: number;
    }) => {
      const { data: result, error } = await supabase
        .from('office_locations')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-locations'] });
      toast.success('Office location updated');
      resetForm();
      setEditingLocation(null);
    },
    onError: () => {
      toast.error('Failed to update office location');
    },
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('office_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-locations'] });
      toast.success('Office location deleted');
    },
    onError: () => {
      toast.error('Failed to delete office location');
    },
  });

  const resetForm = () => {
    setName('');
    setLatitude('');
    setLongitude('');
    setRadius('50');
  };

  const openEditDialog = (location: OfficeLocation) => {
    setEditingLocation(location);
    setName(location.name);
    setLatitude(location.latitude.toString());
    setLongitude(location.longitude.toString());
    setRadius(location.radius_meters.toString());
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        toast.success('Current location captured');
      },
      () => {
        toast.error('Failed to get current location');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCreate = async () => {
    if (!name || !latitude || !longitude || !companyId) {
      toast.error('Please fill in all required fields');
      return;
    }

    await createLocation.mutateAsync({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius_meters: parseInt(radius) || 50,
      company_id: companyId,
    });
  };

  const handleUpdate = async () => {
    if (!editingLocation || !name || !latitude || !longitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    await updateLocation.mutateAsync({
      id: editingLocation.id,
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius_meters: parseInt(radius) || 50,
    });
  };

  const renderForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="location-name">Location Name *</Label>
        <Input
          id="location-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Office, Branch Office"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Coordinates *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="gap-1"
          >
            <Navigation className="h-3 w-3" />
            Use Current Location
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g., 6.9271"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g., 79.8612"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="radius">Radius (meters)</Label>
        <Input
          id="radius"
          type="number"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          placeholder="50"
        />
        <p className="text-xs text-muted-foreground">
          Employees must be within this radius to clock in without WFH request
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Office Locations</h3>
          <p className="text-sm text-muted-foreground">
            Manage office locations for clock-in validation
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Office Location</DialogTitle>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createLocation.isPending}>
                {createLocation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {locations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No office locations configured</p>
              <p className="text-sm">Add locations to enable geofencing for clock-in</p>
            </CardContent>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Radius: {location.radius_meters}m
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog open={editingLocation?.id === location.id} onOpenChange={(open) => !open && setEditingLocation(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(location)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Office Location</DialogTitle>
                        </DialogHeader>
                        {renderForm()}
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleUpdate} disabled={updateLocation.isPending}>
                            {updateLocation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Location</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{location.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteLocation.mutate(location.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
