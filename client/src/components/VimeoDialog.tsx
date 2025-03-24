"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LANGUAGE_CONFIG } from "@/lib/constants"

type VimeoDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string, options: ProcessOptions) => Promise<void>
}

const VimeoDialog = ({ isOpen, onClose, onSubmit }: VimeoDialogProps) => {
  const [videoURL, setVideoURL] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [generateQuizzes, setGenerateQuizzes] = useState(false)
  const [generateAssignments, setGenerateAssignments] = useState(false)
  const [codingAssignments, setCodingAssignments] = useState(false)
  const [language, setLanguage] = useState("Python")
  const [videoSource, setVideoSource] = useState<"vimeo" | "youtube">("vimeo")

  const handleSubmit = async () => {
    if (videoSource === "vimeo" && !isValidVimeoUrl(videoURL)) {
      setError("Invalid Vimeo URL")
      return
    }

    if (videoSource === "youtube" && !isValidYouTubeUrl(videoURL)) {
      setError("Invalid YouTube URL")
      return
    }

    setIsLoading(true)

    try {
      await onSubmit(videoURL, {
        generateQuizzes,
        generateAssignments,
        codingAssignments,
        language: codingAssignments ? language : "python",
        videoSource,
      })
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process video"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isValidYouTubeUrl = (url: string) => {
    return url.includes("youtu.be") || url.includes("youtube.com")
  }

  const isValidVimeoUrl = (url: string) => {
    return url.includes("vimeo.com")
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setError("")
        setVideoURL("")
        setGenerateQuizzes(false)
        setGenerateAssignments(false)
        setCodingAssignments(false)
        setLanguage("python")
        setVideoSource("vimeo")
        onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Process Video
          </DialogTitle>
          <DialogDescription>
            Enter the video link and select processing options. We will automatically process the video and generate
            content for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Video Source</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="vimeo-source"
                    name="video-source"
                    checked={videoSource === "vimeo"}
                    onChange={() => setVideoSource("vimeo")}
                  />
                  <label htmlFor="vimeo-source">Vimeo</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="youtube-source"
                    name="video-source"
                    checked={videoSource === "youtube"}
                    onChange={() => setVideoSource("youtube")}
                  />
                  <label htmlFor="youtube-source">YouTube</label>
                </div>
              </div>
            </div>
            
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              type="url"
              placeholder={videoSource === "vimeo" ? "Vimeo Video URL" : "YouTube Video URL"}
              value={videoURL}
              onChange={(e) => {
                setVideoURL(e.target.value)
                setError("")
              }}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="generate-quizzes">Generate Quizzes</Label>
              <Switch id="generate-quizzes" checked={generateQuizzes} onCheckedChange={setGenerateQuizzes} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="generate-assignments">Generate Assignments</Label>
              <Switch
                id="generate-assignments"
                checked={generateAssignments}
                onCheckedChange={(checked) => {
                  setGenerateAssignments(checked)
                  if (!checked) {
                    setCodingAssignments(false)
                  }
                }}
              />
            </div>
            {generateAssignments && (
              <div className="flex items-center justify-between pl-4">
                <Label htmlFor="coding-assignments">Coding Assignments</Label>
                <Switch id="coding-assignments" checked={codingAssignments} onCheckedChange={setCodingAssignments} />
              </div>
            )}
            {codingAssignments && (
              <div className="flex items-center justify-between pl-4">
                <Label htmlFor="coding-language">Programming Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LANGUAGE_CONFIG).map((lang) => (
                      <SelectItem key={lang.id} value={lang.label}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
              {videoSource === "vimeo" ? (
                <>
                  <li>Vimeo video must be accessible (unlisted or public)</li>
                  <li>You must have authorization to access the video</li>
                </>
              ) : (
                <>
                  <li>YouTube video must be publicly accessible</li>
                  <li>Captions/transcripts must be enabled on the video</li>
                </>
              )}
              <li>Duration should not exceed 2 hours</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !videoURL || 
              isLoading || 
              (videoSource === "vimeo" && !isValidVimeoUrl(videoURL)) || 
              (videoSource === "youtube" && !isValidYouTubeUrl(videoURL))
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
  )
}

export default VimeoDialog
