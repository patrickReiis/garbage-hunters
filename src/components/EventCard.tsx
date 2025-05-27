import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { NostrEvent } from "@nostrify/nostrify";
import { useAuthor } from "@/hooks/useAuthor";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { toast } from "@/hooks/useToast";

interface EventCardProps {
  event: NostrEvent & { parsedContent: any; startDate: Date };
  isPast?: boolean;
}

export function EventCard({ event, isPast }: EventCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();

  const content = event.parsedContent;

  // Create naddr for the event
  const identifier = event.tags.find(tag => tag[0] === "d")?.[1] || "";
  const naddr = nip19.naddrEncode({
    identifier,
    pubkey: event.pubkey,
    kind: event.kind,
  });

  // Get RSVPs
  const { data: rsvps } = useQuery({
    queryKey: ["event-rsvps", event.id],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(2000)]);
      const rsvpEvents = await nostr.query([
        { kinds: [30311], "#a": [`${event.kind}:${event.pubkey}:${identifier}`] }
      ], { signal });
      return rsvpEvents;
    },
  });

  const attendeeCount = rsvps?.length || 0;
  const isAttending = user && rsvps?.some(r => r.pubkey === user.pubkey);

  const handleRSVP = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to RSVP to events",
        variant: "destructive",
      });
      return;
    }

    publishEvent(
      {
        kind: 30311,
        content: JSON.stringify({ status: "attending" }),
        tags: [
          ["a", `${event.kind}:${event.pubkey}:${identifier}`],
          ["d", `rsvp-${event.id}-${user.pubkey}`],
        ],
      },
      {
        onSuccess: () => {
          toast({
            title: "RSVP Confirmed!",
            description: "You're registered for this cleanup event",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to RSVP",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isPast ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={metadata?.picture} />
              <AvatarFallback>{metadata?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{metadata?.name || "Anonymous"}</p>
              <p className="text-xs text-gray-500">Organizer</p>
            </div>
          </div>
          <Badge variant={isPast ? "secondary" : "default"}>
            {isPast ? "Past Event" : "Upcoming"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(event.startDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{format(event.startDate, "h:mm a")}</span>
            {content.endDate && (
              <span>- {format(new Date(content.endDate), "h:mm a")}</span>
            )}
          </div>
          
          {content.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{content.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{attendeeCount} attending</span>
          </div>
        </div>
        
        {content.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-3">
            {content.description}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-2">
        <Link to={`/event/${naddr}`} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            View Details
          </Button>
        </Link>
        
        {!isPast && (
          <Button 
            size="sm" 
            onClick={handleRSVP}
            disabled={isAttending}
            variant={isAttending ? "secondary" : "default"}
          >
            {isAttending ? "Attending" : "RSVP"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}