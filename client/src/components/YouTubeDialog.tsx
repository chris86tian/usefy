'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Youtube } from 'lucide-react';

type YouTubeDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => Promise<void>;
};

const YouTubeDialog = ({ isOpen, onClose, onSubmit }: YouTubeDialogProps) => {
  const [youtubeURL, setYoutubeURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(youtubeURL);
      setYoutubeURL('');
      onClose();
    } catch (error) {
      console.error('Error processing URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube size={24} />
            Process YouTube Video
          </DialogTitle>
          <DialogDescription>
            Enter the YouTube link. 
            We will automatically process the video and generate chapters for you.
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
              onChange={(e) => setYoutubeURL(e.target.value)}
              className="w-full"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            The video must be publicly accessible and have captions available. The duration of the video should not exceed 2 hours.
          </p>
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
            disabled={!youtubeURL || isLoading || (!youtubeURL.includes('youtu.be') && !youtubeURL.includes('youtube.com'))}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </span>
            ) : (
              'Process'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeDialog;