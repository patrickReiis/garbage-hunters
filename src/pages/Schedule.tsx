import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Plus, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Schedule() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("upcoming");

  const { data: events, isLoading } = useQuery({
    queryKey: ["cleanup-events"],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([{ kinds: [31923], "#t": ["cleanup-event"] }], { signal });
      return events;
    },
  });

  // Parse event dates and filter
  const now = new Date();
  const parsedEvents = events?.map(event => {
    try {
      const content = JSON.parse(event.content);
      const startDate = new Date(content.startDate);
      return { ...event, parsedContent: content, startDate };
    } catch {
      return null;
    }
  }).filter(Boolean) as any[];

  const upcomingEvents = parsedEvents?.filter(event => event.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const pastEvents = parsedEvents?.filter(event => event.startDate <= now)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  // Filter events based on search term
  const filterEvents = (eventsList: any[]) => {
    if (!searchTerm) return eventsList;
    
    const searchLower = searchTerm.toLowerCase();
    return eventsList.filter(event => {
      const content = event.parsedContent;
      return (
        content.title?.toLowerCase().includes(searchLower) ||
        content.description?.toLowerCase().includes(searchLower) ||
        content.location?.toLowerCase().includes(searchLower)
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cleanup Events</h1>
          <p className="text-gray-600 mt-1">Join or organize community cleanup events</p>
        </div>
        
        {user && (
          <Link to="/schedule/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search events by title, description, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : upcomingEvents && filterEvents(upcomingEvents).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterEvents(upcomingEvents).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming events found</p>
              {user && (
                <Link to="/schedule/new">
                  <Button className="mt-4" variant="outline">
                    Create the first event
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : pastEvents && filterEvents(pastEvents).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterEvents(pastEvents).map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No past events found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}