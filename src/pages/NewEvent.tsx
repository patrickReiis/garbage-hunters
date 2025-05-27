import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/useToast";
import { nip19 } from "nostr-tools";
import { format } from "date-fns";

export default function NewEvent() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to create an event",
        variant: "destructive",
      });
      return;
    }

    if (!title || !description || !location || !date || !startTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDate = new Date(`${date}T${startTime}`);
      const endDate = endTime ? new Date(`${date}T${endTime}`) : null;

      const content = JSON.stringify({
        title,
        description,
        location,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        instructions,
      });

      const identifier = `event-${Date.now()}`;
      const tags: string[][] = [
        ["t", "cleanup-event"],
        ["d", identifier],
        ["location", location],
        ["start", Math.floor(startDate.getTime() / 1000).toString()],
      ];

      if (endDate) {
        tags.push(["end", Math.floor(endDate.getTime() / 1000).toString()]);
      }

      publishEvent(
        {
          kind: 31923,
          content,
          tags,
        },
        {
          onSuccess: (event) => {
            toast({
              title: "Success!",
              description: "Your event has been created",
            });
            
            // Navigate to the event page
            const naddr = nip19.naddrEncode({
              identifier,
              pubkey: event.pubkey,
              kind: event.kind,
            });
            navigate(`/event/${naddr}`);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message || "Failed to create event",
              variant: "destructive",
            });
          },
        }
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid date or time format",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please login to create cleanup events.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Set minimum date to today
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Cleanup Event</CardTitle>
          <CardDescription>
            Organize a community cleanup event and invite others to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Beach Cleanup Day"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the cleanup event, what to expect, what to bring, etc."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="location">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location *
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Central Park Main Entrance, New York"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                />
              </div>

              <div>
                <Label htmlFor="startTime">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime">
                  <Clock className="inline h-4 w-4 mr-1" />
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any special instructions, what to bring, where to meet exactly, parking info, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isPublishing}
                className="flex-1"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating event...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/schedule")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}