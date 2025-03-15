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

type YouTubeDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string, options: ProcessOptions) => Promise<void>
}

const YouTubeDialog = ({ isOpen, onClose, onSubmit }: YouTubeDialogProps) => {
  const [youtubeURL, setYoutubeURL] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [generateQuizzes, setGenerateQuizzes] = useState(false)
  const [generateAssignments, setGenerateAssignments] = useState(false)
  const [codingAssignments, setCodingAssignments] = useState(false)
  const [language, setLanguage] = useState("Python")

  const handleSubmit = async () => {
    if (!isValidYouTubeUrl(youtubeURL)) {
      setError("Invalid YouTube URL")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: youtubeURL,
          generateQuizzes,
          generateAssignments,
          codingAssignments,
          language: codingAssignments ? language : "python",
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      await onSubmit(youtubeURL, {
        generateQuizzes,
        generateAssignments,
        codingAssignments,
        language,
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setError("")
        setYoutubeURL("")
        setGenerateQuizzes(false)
        setGenerateAssignments(false)
        setCodingAssignments(false)
        setLanguage("python")
        onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Process YouTube Video
          </DialogTitle>
          <DialogDescription>
            Enter the YouTube link and select processing options. We will automatically process the video and generate
            content for you.
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
                setYoutubeURL(e.target.value)
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
              <li>Video must be publicly accessible</li>
              <li>Captions/transcripts must be enabled on the video</li>
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
            disabled={!youtubeURL || isLoading || !isValidYouTubeUrl(youtubeURL)}
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

export default YouTubeDialog