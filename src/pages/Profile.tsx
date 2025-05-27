import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Edit, Trash2, Calendar } from "lucide-react";
import { CleanupCard } from "@/components/CleanupCard";
import { EventCard } from "@/components/EventCard";
import { Link } from "react-router-dom";
import { EditProfileForm } from "@/components/EditProfileForm";
import { useState } from "react";

export default function Profile() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch user's cleanups
  const { data: userCleanups, isLoading: cleanupsLoading } = useQuery({
    queryKey: ["user-cleanups", user?.pubkey],
    queryFn: async (c) => {
      if (!user) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        { kinds: [30023], authors: [user.pubkey], "#t": ["garbage-cleanup"] }
      ], { signal });
      
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user,
  });

  // Fetch user's events
  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["user-events", user?.pubkey],
    queryFn: async (c) => {
      if (!user) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        { kinds: [31923], authors: [user.pubkey], "#t": ["cleanup-event"] }
      ], { signal });
      
      // Parse and sort events
      const parsedEvents = events.map(event => {
        try {
          const content = JSON.parse(event.content);
          const startDate = new Date(content.startDate);
          return { ...event, parsedContent: content, startDate };
        } catch {
          return null;
        }
      }).filter(Boolean) as any[];
      
      return parsedEvents.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please login to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const metadata = user.metadata;
  const cleanupCount = userCleanups?.length || 0;
  const eventCount = userEvents?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showEditForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <EditProfileForm />
            <Button
              variant="outline"
              onClick={() => setShowEditForm(false)}
              className="mt-4"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={metadata?.picture} />
                  <AvatarFallback className="text-2xl">
                    {metadata?.name?.[0] || user.pubkey.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{metadata?.name || "Anonymous"}</h1>
                  {metadata?.about && (
                    <p className="text-gray-600 mt-1">{metadata.about}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{cleanupCount}</p>
                      <p className="text-sm text-gray-500">Cleanups</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{eventCount}</p>
                      <p className="text-sm text-gray-500">Events Organized</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="cleanups" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cleanups">My Cleanups</TabsTrigger>
              <TabsTrigger value="events">My Events</TabsTrigger>
            </TabsList>

            <TabsContent value="cleanups">
              {cleanupsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : userCleanups && userCleanups.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCleanups.map((event) => (
                    <CleanupCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You haven't shared any cleanups yet</p>
                  <Link to="/cleanups/new">
                    <Button>Share Your First Cleanup</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="events">
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : userEvents && userEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You haven't organized any events yet</p>
                  <Link to="/schedule/new">
                    <Button>Create Your First Event</Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}