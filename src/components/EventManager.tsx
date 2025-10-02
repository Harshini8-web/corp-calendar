import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, MapPin, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventManager({ onUpdate }: { onUpdate: () => void }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        ticket_types(*)
      `)
      .order('start_ts', { ascending: false });

    if (error) {
      toast.error('Failed to load events');
      return;
    }

    setEvents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const startDate = formData.get('start_date') as string;
    const startTime = formData.get('start_time') as string;
    const endDate = formData.get('end_date') as string;
    const endTime = formData.get('end_time') as string;

    const start_ts = `${startDate}T${startTime}:00`;
    const end_ts = `${endDate}T${endTime}:00`;

    if (new Date(start_ts) >= new Date(end_ts)) {
      toast.error('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          venue_name: formData.get('venue_name') as string,
          venue_location: formData.get('venue_location') as string || null,
          start_ts,
          end_ts,
          capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string) : null
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create default ticket type
      const ticketTypes = [
        {
          event_id: event.id,
          name: 'Standard',
          kind: 'free' as const,
          price: 0
        }
      ];

      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticketTypes);

      if (ticketError) throw ticketError;

      toast.success('Event created successfully');
      setIsDialogOpen(false);
      loadEvents();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete event');
      return;
    }

    toast.success('Event deleted');
    loadEvents();
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-muted-foreground">Create and manage corporate events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>Schedule a new corporate event</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  disabled={loading}
                  placeholder="Annual Company Meeting"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  disabled={loading}
                  placeholder="Event details and agenda..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_name">Venue Name</Label>
                <Input
                  id="venue_name"
                  name="venue_name"
                  required
                  disabled={loading}
                  placeholder="Main Conference Hall"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_location">Venue Location (optional)</Label>
                <Input
                  id="venue_location"
                  name="venue_location"
                  disabled={loading}
                  placeholder="Building A, Floor 3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    required
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity Override (optional)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  disabled={loading}
                  placeholder="Leave empty to use venue capacity"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle>{event.title}</CardTitle>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.start_ts), 'PPp')} - {format(new Date(event.end_ts), 'p')}
                    </div>
                    {event.venue_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue_name}
                        {event.venue_location && ` - ${event.venue_location}`}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Capacity: {event.capacity}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {event.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No events yet. Create your first event to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
