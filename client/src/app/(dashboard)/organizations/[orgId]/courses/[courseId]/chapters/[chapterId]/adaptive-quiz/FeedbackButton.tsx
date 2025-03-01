"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useCreateFeedbackMutation } from "@/state/api"

interface FeedbackButtonProps {
  feedbackType: 'question' | 'assignment';
  itemId: string;
  courseId: string;
  sectionId: string;
  chapterId: string;
}

const FeedbackButton = ({ feedbackType, itemId, courseId, sectionId, chapterId }: FeedbackButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const [createFeedback] = useCreateFeedbackMutation()

  const getUsername = () => {
    return user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    const feedbackData = {
      feedbackType,
      [feedbackType === 'question' ? 'questionId' : 'assignmentId']: itemId,
      userId: user?.id as string,
      username: getUsername(),
      courseId,
      sectionId,
      chapterId,
      feedback,
      createdAt: new Date().toISOString(),
      status: "new",
      updatedAt: new Date().toISOString(),
    }

    setIsSubmitting(true)
    try {
      await createFeedback(feedbackData).unwrap()
    
      toast.success("Thank you for your feedback!")
      setIsOpen(false)
      setFeedback("")
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Please describe the issue with this assignment..."
            disabled={isSubmitting}
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FeedbackButton