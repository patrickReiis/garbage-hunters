import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { NostrEvent } from "@nostrify/nostrify";
import { useAuthor } from "@/hooks/useAuthor";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";

interface CleanupCardProps {
  event: NostrEvent;
}

export function CleanupCard({ event }: CleanupCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;

  // Parse the content
  let content: any = {};
  try {
    content = JSON.parse(event.content);
  } catch (e) {
    // If parsing fails, treat as plain text
    content = { description: event.content };
  }

  // Get images from tags
  const beforeImage = event.tags.find(tag => tag[0] === "image" && tag[2] === "before")?.[1];
  const afterImage = event.tags.find(tag => tag[0] === "image" && tag[2] === "after")?.[1];
  const location = event.tags.find(tag => tag[0] === "location")?.[1];

  // Create naddr for the event
  const identifier = event.tags.find(tag => tag[0] === "d")?.[1] || "";
  const naddr = nip19.naddrEncode({
    identifier,
    pubkey: event.pubkey,
    kind: event.kind,
  });

  return (
    <Link to={`/cleanup/${naddr}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={metadata?.picture} />
                <AvatarFallback>{metadata?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{metadata?.name || "Anonymous"}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Cleanup</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          {(beforeImage || afterImage) && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {beforeImage && (
                <div className="relative">
                  <img 
                    src={beforeImage} 
                    alt="Before cleanup" 
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Before
                  </span>
                </div>
              )}
              {afterImage && (
                <div className="relative">
                  <img 
                    src={afterImage} 
                    alt="After cleanup" 
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    After
                  </span>
                </div>
              )}
            </div>
          )}
          
          {content.title && (
            <h3 className="font-semibold text-sm mb-1">{content.title}</h3>
          )}
          
          {content.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{content.description}</p>
          )}
        </CardContent>
        
        {location && (
          <CardFooter className="pt-0">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}