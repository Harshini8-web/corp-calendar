import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EventCardProps {
  event: any;
  onRegister: () => void;
}

export default function EventCard({ event, onRegister }: EventCardProps) {
  const { user } = useAuth();
  const [registering, setRegistering] = useState(false);

  const handleRegister = async (ticketTypeId: string) => {
    if (!user) {
      toast.error('Please sign in to register');
      return;
    }

    setRegistering(true);

    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', event.id)
        .eq('ticket_type_id', ticketTypeId)
        .single();

      if (existing) {
        toast.error('You are already registered for this event');
        setRegistering(false);
        return;
      }

      // Register
      const { error } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          event_id: event.id,
          ticket_type_id: ticketTypeId,
          status: 'confirmed'
        });

      if (error) throw error;

      // Increment sold count
      await supabase.rpc('increment_ticket_sold_count', { ticket_id: ticketTypeId });

      toast.success('Successfully registered for event!');
      onRegister();
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(event.start_ts), 'PPp')}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.venue_name}
            {event.venue_location && ` - ${event.venue_location}`}
          </div>
          {event.capacity && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Capacity: {event.capacity}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Available Tickets</span>
          </div>
          
          {event.ticket_types?.map((ticket: any) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ticket.name}</span>
                  <Badge variant={ticket.kind === 'free' ? 'secondary' : 'default'}>
                    {ticket.kind}
                  </Badge>
                </div>
                {ticket.price > 0 && (
                  <span className="text-sm text-muted-foreground">₹{ticket.price}</span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleRegister(ticket.id)}
                disabled={registering}
              >
                Register
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
