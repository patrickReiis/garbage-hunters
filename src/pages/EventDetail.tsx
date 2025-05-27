import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { useAuthor } from "@/hooks/useAuthor";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Calendar, Clock, Users, ArrowLeft, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { nip19 } from "nostr-tools";
import { toast } from "@/hooks/useToast";

export default function EventDetail() {
  const { naddr } = useParams();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();

  // Decode the naddr
  let decodedAddr: any = null;
  try {
    if (naddr) {
      const decoded = nip19.decode(naddr);
      if (decoded.type === "naddr") {
        decodedAddr = decoded.data;
      }
    }
  } catch (e) {
    console.error("Invalid naddr:", e);
  }

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", naddr],
    queryFn: async (c) => {
      if (!decodedAddr) throw new Error("Invalid event ID");
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([{
        kinds: [decodedAddr.kind],
        authors: [decodedAddr.pubkey],
        "#d": [decodedAddr.identifier],
      }], { signal });
      
      return events[0];
    },
    enabled: !!decodedAddr,
  });

  // Get RSVPs
  const { data: rsvps, refetch: refetchRSVPs } = useQuery({
    queryKey: ["event-rsvps-detail", event?.id],
    queryFn: async (c) => {
      if (!event || !decodedAddr) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(2000)]);
      const rsvpEvents = await nostr.query([
        { kinds: [30311], "#a": [`${decodedAddr.kind}:${decodedAddr.pubkey}:${decodedAddr.identifier}`] }
      ], { signal });
      return rsvpEvents;
    },
    enabled: !!event,
  });

  const author = useAuthor(event?.pubkey || "");
  const metadata = author.data?.metadata;

  const isAttending = user && rsvps?.some(r => r.pubkey === user.pubkey);

  const handleRSVP = () => {
    if (!user || !event || !decodedAddr) {
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
          ["a", `${decodedAddr.kind}:${decodedAddr.pubkey}:${decodedAddr.identifier}`],
          ["d", `rsvp-${event.id}-${user.pubkey}`],
        ],
      },
      {
        onSuccess: () => {
          toast({
            title: "RSVP Confirmed!",
            description: "You're registered for this cleanup event",
          });
          refetchRSVPs();
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

  if (!decodedAddr) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Invalid event ID</p>
            <div className="text-center mt-4">
              <Button onClick={() => navigate("/schedule")}>
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Event not found</p>
            <div className="text-center mt-4">
              <Button onClick={() => navigate("/schedule")}>
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse content
  let content: any = {};
  try {
    content = JSON.parse(event.content);
  } catch (e) {
    content = { description: event.content };
  }

  const startDate = new Date(content.startDate);
  const endDate = content.endDate ? new Date(content.endDate) : null;
  const isPast = startDate < new Date();

  // Get unique attendees
  const attendees = rsvps?.map(r => r.pubkey) || [];
  const uniqueAttendees = [...new Set(attendees)];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/schedule")}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={metadata?.picture} />
                <AvatarFallback>{metadata?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{metadata?.name || "Anonymous"}</p>
                <p className="text-sm text-gray-500">Event Organizer</p>
              </div>
            </div>
            <Badge variant={isPast ? "secondary" : "default"}>
              {isPast ? "Past Event" : "Upcoming"}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold mb-4">{content.title}</h1>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{format(startDate, "EEEE, MMMM d, yyyy")}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{format(startDate, "h:mm a")}</span>
              {endDate && (
                <span>- {format(endDate, "h:mm a")}</span>
              )}
            </div>

            {content.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{content.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{uniqueAttendees.length} attending</span>
            </div>
          </div>

          {!isPast && (
            <div className="mt-6">
              <Button
                onClick={handleRSVP}
                disabled={isAttending}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isAttending ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    You're Attending
                  </>
                ) : (
                  "RSVP to Attend"
                )}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold text-lg mb-2">About this Event</h2>
            <p className="whitespace-pre-wrap text-gray-600">{content.description}</p>
          </div>

          {content.instructions && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold text-lg mb-2">Special Instructions</h2>
                <p className="whitespace-pre-wrap text-gray-600">{content.instructions}</p>
              </div>
            </>
          )}

          {uniqueAttendees.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold text-lg mb-3">Attendees ({uniqueAttendees.length})</h2>
                <div className="flex flex-wrap gap-2">
                  {uniqueAttendees.slice(0, 20).map((pubkey) => (
                    <AttendeeAvatar key={pubkey} pubkey={pubkey} />
                  ))}
                  {uniqueAttendees.length > 20 && (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-sm font-medium">
                      +{uniqueAttendees.length - 20}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendeeAvatar({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;

  return (
    <Avatar className="h-10 w-10">
      <AvatarImage src={metadata?.picture} />
      <AvatarFallback>{metadata?.name?.[0] || "?"}</AvatarFallback>
    </Avatar>
  );
}