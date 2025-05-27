import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calendar, Camera, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { NostrEvent } from "@nostrify/nostrify";
import { CleanupCard } from "@/components/CleanupCard";

const Index = () => {
  const { nostr } = useNostr();

  // Fetch recent cleanups
  const { data: recentCleanups } = useQuery({
    queryKey: ["recent-cleanups"],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([{ kinds: [30023], limit: 6, "#t": ["garbage-cleanup"] }], { signal });
      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Join the Garbage Hunters Community
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Share your cleanup efforts and organize community trash removal events
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/cleanups/new">
            <Button size="lg" className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Share a Cleanup
            </Button>
          </Link>
          <Link to="/schedule/new">
            <Button size="lg" variant="outline" className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule an Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-600" />
              Before & After Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Document your cleanup efforts with before and after photos to inspire others
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Community Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Organize and join local cleanup events to make a bigger impact together
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-purple-600" />
              Track Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              See the collective impact of the community's cleanup efforts over time
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cleanups */}
      {recentCleanups && recentCleanups.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Cleanups</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCleanups.map((event) => (
              <CleanupCard key={event.id} event={event} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/cleanups">
              <Button variant="outline">View All Cleanups</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
