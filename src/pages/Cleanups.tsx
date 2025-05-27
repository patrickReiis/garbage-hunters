import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { CleanupCard } from "@/components/CleanupCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Cleanups() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const { data: cleanups, isLoading } = useQuery({
    queryKey: ["cleanups", sortBy],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([{ kinds: [30023], "#t": ["garbage-cleanup"] }], { signal });
      
      // Sort events
      const sorted = [...events].sort((a, b) => {
        if (sortBy === "recent") {
          return b.created_at - a.created_at;
        }
        return a.created_at - b.created_at;
      });
      
      return sorted;
    },
  });

  // Filter cleanups based on search term
  const filteredCleanups = cleanups?.filter(event => {
    if (!searchTerm) return true;
    
    try {
      const content = JSON.parse(event.content);
      const searchLower = searchTerm.toLowerCase();
      
      return (
        content.title?.toLowerCase().includes(searchLower) ||
        content.description?.toLowerCase().includes(searchLower) ||
        event.tags.find(tag => tag[0] === "location")?.[1]?.toLowerCase().includes(searchLower)
      );
    } catch {
      return event.content.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cleanup Gallery</h1>
          <p className="text-gray-600 mt-1">Browse and discover cleanup efforts from the community</p>
        </div>
        
        {user && (
          <Link to="/cleanups/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Share Cleanup
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredCleanups && filteredCleanups.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCleanups.map((event) => (
            <CleanupCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No cleanups found</p>
          {user && (
            <Link to="/cleanups/new">
              <Button className="mt-4" variant="outline">
                Be the first to share a cleanup
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}