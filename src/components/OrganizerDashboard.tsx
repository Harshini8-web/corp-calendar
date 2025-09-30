import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import VenueManager from './VenueManager';
import EventManager from './EventManager';
import RegistrationsList from './RegistrationsList';
import { toast } from 'sonner';

export default function OrganizerDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalVenues: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [eventsRes, venuesRes, regsRes] = await Promise.all([
        supabase.from('events').select('id, start_ts', { count: 'exact' }),
        supabase.from('venues').select('id', { count: 'exact' }),
        supabase.from('registrations').select('id', { count: 'exact' })
      ]);

      const upcoming = eventsRes.data?.filter(e => new Date(e.start_ts) > new Date()).length || 0;

      setStats({
        totalEvents: eventsRes.count || 0,
        totalVenues: venuesRes.count || 0,
        totalRegistrations: regsRes.count || 0,
        upcomingEvents: upcoming
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Organizer Dashboard</h1>
        <p className="text-muted-foreground">Manage venues, events, and registrations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{stats.totalEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming Events</CardDescription>
            <CardTitle className="text-3xl">{stats.upcomingEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Venues</CardDescription>
            <CardTitle className="text-3xl">{stats.totalVenues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Registrations</CardDescription>
            <CardTitle className="text-3xl">{stats.totalRegistrations}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <EventManager onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="venues" className="space-y-4">
          <VenueManager onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <RegistrationsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
