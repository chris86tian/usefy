"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type YouTubeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
};

const YouTubeDialog = ({ isOpen, onClose, onSubmit }: YouTubeDialogProps) => {
  const [youtubeURL, setYoutubeURL] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!youtubeURL) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: youtubeURL }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Failed to process video"
        );
      }

      await onSubmit(youtubeURL);
      setYoutubeURL("");
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process video";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidYouTubeUrl = (url: string) => {
    return url.includes("youtu.be") || url.includes("youtube.com");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setError("");
        setYoutubeURL("");
        onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube size={24} />
            Process YouTube Video
          </DialogTitle>
          <DialogDescription>
            Enter the YouTube link. We will automatically process the video and
            generate chapters for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">Video URL</Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="YouTube Video URL"
              value={youtubeURL}
              onChange={(e) => {
                setYoutubeURL(e.target.value);
                setError("");
              }}
              className="w-full"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Video must be publicly accessible</li>
              <li>Captions/transcripts must be enabled on the video</li>
              <li>Duration should not exceed 2 hours</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !youtubeURL || isLoading || !isValidYouTubeUrl(youtubeURL)
            }
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </span>
            ) : (
              "Process"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeDialog;
