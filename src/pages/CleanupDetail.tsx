import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { useAuthor } from "@/hooks/useAuthor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nip19 } from "nostr-tools";

export default function CleanupDetail() {
  const { naddr } = useParams();
  const navigate = useNavigate();
  const { nostr } = useNostr();

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
    queryKey: ["cleanup", naddr],
    queryFn: async (c) => {
      if (!decodedAddr) throw new Error("Invalid cleanup ID");
      
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

  const author = useAuthor(event?.pubkey || "");
  const metadata = author.data?.metadata;

  if (!decodedAddr) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Invalid cleanup ID</p>
            <div className="text-center mt-4">
              <Button onClick={() => navigate("/cleanups")}>
                Back to Cleanups
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
            <p className="text-center text-gray-500">Cleanup not found</p>
            <div className="text-center mt-4">
              <Button onClick={() => navigate("/cleanups")}>
                Back to Cleanups
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

  // Get images and location from tags
  const beforeImage = event.tags.find(tag => tag[0] === "image" && tag[2] === "before")?.[1];
  const afterImage = event.tags.find(tag => tag[0] === "image" && tag[2] === "after")?.[1];
  const location = event.tags.find(tag => tag[0] === "location")?.[1];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/cleanups")}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cleanups
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
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Cleanup</Badge>
          </div>

          {content.title && (
            <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
          )}

          {location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {(beforeImage || afterImage) && (
            <div className="grid md:grid-cols-2 gap-4">
              {beforeImage && (
                <div className="relative">
                  <img
                    src={beforeImage}
                    alt="Before cleanup"
                    className="w-full rounded-lg"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-sm px-3 py-1 rounded">
                    Before
                  </span>
                </div>
              )}
              {afterImage && (
                <div className="relative">
                  <img
                    src={afterImage}
                    alt="After cleanup"
                    className="w-full rounded-lg"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-sm px-3 py-1 rounded">
                    After
                  </span>
                </div>
              )}
            </div>
          )}

          {content.description && (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{content.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}