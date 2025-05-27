import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useUploadFile } from "@/hooks/useUploadFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, X, MapPin } from "lucide-react";
import { toast } from "@/hooks/useToast";
import { nip19 } from "nostr-tools";

export default function NewCleanup() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string>("");
  const [afterPreview, setAfterPreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "before") {
        setBeforeImage(file);
        setBeforePreview(URL.createObjectURL(file));
      } else {
        setAfterImage(file);
        setAfterPreview(URL.createObjectURL(file));
      }
    }
  };

  const removeImage = (type: "before" | "after") => {
    if (type === "before") {
      setBeforeImage(null);
      setBeforePreview("");
    } else {
      setAfterImage(null);
      setAfterPreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to share a cleanup",
        variant: "destructive",
      });
      return;
    }

    if (!title || !description) {
      toast({
        title: "Missing information",
        description: "Please provide a title and description",
        variant: "destructive",
      });
      return;
    }

    try {
      const tags: string[][] = [
        ["t", "garbage-cleanup"],
        ["d", `cleanup-${Date.now()}`],
      ];

      // Upload images if provided
      if (beforeImage) {
        const [[_, beforeUrl]] = await uploadFile(beforeImage);
        tags.push(["image", beforeUrl, "before"]);
      }

      if (afterImage) {
        const [[_, afterUrl]] = await uploadFile(afterImage);
        tags.push(["image", afterUrl, "after"]);
      }

      if (location) {
        tags.push(["location", location]);
      }

      const content = JSON.stringify({
        title,
        description,
      });

      publishEvent(
        {
          kind: 30023,
          content,
          tags,
        },
        {
          onSuccess: (event) => {
            toast({
              title: "Success!",
              description: "Your cleanup has been shared",
            });
            
            // Navigate to the cleanup page
            const naddr = nip19.naddrEncode({
              identifier: tags.find(tag => tag[0] === "d")?.[1] || "",
              pubkey: event.pubkey,
              kind: event.kind,
            });
            navigate(`/cleanup/${naddr}`);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message || "Failed to publish cleanup",
              variant: "destructive",
            });
          },
        }
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please login to share your cleanup efforts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Share Your Cleanup</CardTitle>
          <CardDescription>
            Document your cleanup effort with before and after photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Beach cleanup at Sunset Bay"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the cleanup effort, what you found, how long it took, etc."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="location">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Sunset Bay Beach, California"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Before Photo</Label>
                {beforePreview ? (
                  <div className="relative mt-2">
                    <img
                      src={beforePreview}
                      alt="Before cleanup"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage("before")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">Upload before photo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "before")}
                    />
                  </label>
                )}
              </div>

              <div>
                <Label>After Photo</Label>
                {afterPreview ? (
                  <div className="relative mt-2">
                    <img
                      src={afterPreview}
                      alt="After cleanup"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage("after")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">Upload after photo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "after")}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isPublishing || isUploading}
                className="flex-1"
              >
                {isPublishing || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading images..." : "Publishing..."}
                  </>
                ) : (
                  "Share Cleanup"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/cleanups")}
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