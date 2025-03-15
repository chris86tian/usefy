"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useCreateSubmissionMutation } from "@/state/api"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, LinkIcon, X, UploadCloud } from "lucide-react"

interface SubmissionModalProps {
  assignment: {
    assignmentId: string
    title: string
  }
  courseId: string
  sectionId: string
  chapterId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmissionComplete: () => void
}

export default function SubmissionModal({
  assignment,
  courseId,
  sectionId,
  chapterId,
  open,
  onOpenChange,
  onSubmissionComplete,
}: SubmissionModalProps) {
  const { user } = useUser()
  const [createSubmission, { isLoading }] = useCreateSubmissionMutation()
  const [comment, setComment] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink)) {
      setLinks((prev) => [...prev, newLink])
      setNewLink("")
    }
  }

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to submit an assignment")
      return
    }

    try {
      // Convert files to base64 strings
      const filePromises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
        })
      })

      const fileContents = await Promise.all(filePromises)

      // Create submission object
      const submissionData = {
        submissionId: uuidv4(),
        userId: user.id,
        comment,
        filesUrls: [], // TODO: Upload files to S3 and store URLs
        links,
        timestamp: new Date().toISOString(),
      }

      await createSubmission({
        courseId,
        sectionId,
        chapterId,
        assignmentId: assignment.assignmentId,
        submission: submissionData,
      }).unwrap()

      toast.success("Assignment submitted successfully!")
      onSubmissionComplete()
    } catch (error) {
      console.error("Failed to submit assignment:", error)
      toast.error("Failed to submit assignment. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit Assignment: {assignment.title}</DialogTitle>
          <DialogDescription>Upload files, add links, or write comments to submit your assignment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Comments</Label>
            <Textarea
              id="comment"
              placeholder="Add any comments or notes about your submission..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Files</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md text-sm">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" multiple />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Links</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md text-sm">
                  <span className="truncate max-w-[200px]">{link}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeLink(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a link (e.g., GitHub repository)"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addLink}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

