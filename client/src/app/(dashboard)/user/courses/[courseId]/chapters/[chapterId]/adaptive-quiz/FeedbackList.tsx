"use client"

import { useGetFeedbackQuery, useUpdateFeedbackStatusMutation } from "@/state/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/state/redux"
import { openChapterModal } from "@/state"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react";
import { useDeleteFeedbackMutation } from "@/state/api";
import { courseSchema } from "@/lib/schemas"

interface FeedbackListProps {
  courseId: string
}

const FeedbackList = ({ courseId }: FeedbackListProps) => {
  const [deleteFeedback, { isLoading: isDeleting }] = useDeleteFeedbackMutation();

  const handleDelete = async (feedbackId: string) => {
    try {
      await deleteFeedback(feedbackId).unwrap();
      toast.success("Feedback deleted successfully");
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };
  const { user } = useUser()
  const { data: feedbacks, isLoading, error } = useGetFeedbackQuery(courseId)
  const [updateStatus] = useUpdateFeedbackStatusMutation()

  const StatusBadge = ({ status }: { status?: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'new' ? 'bg-yellow-500/20 text-yellow-500' :
      status === 'resolved' ? 'bg-green-500/20 text-green-500' :
      'bg-red-500/20 text-red-500'
    }`}>
      {status?.replace(/_/g, ' ') || 'undefined'}
    </span>
  )

  // Link to Assignment/Question:

  const dispatch = useAppDispatch()
  const router = useRouter()
  const course = useAppSelector((state) => state.global.courseEditor)

  const handleFeedbackClick = (courseId: string, sectionId: string, chapterId: string) => {
    const sectionIndex = course.sections.findIndex((s) => s.sectionId === sectionId) ?? 0
    const chapterIndex = course.sections[sectionIndex]?.chapters.findIndex((c) => c.chapterId === chapterId) ?? 0
    dispatch(openChapterModal({ sectionIndex, chapterIndex }))
    router.push(`/teacher/courses/${courseId}`)
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      await updateStatus({ feedbackId, status: newStatus }).unwrap()
      toast.success("Status updated successfully")
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  if (isLoading) return (
    <div className="flex justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
  
  if (error) return <div className="text-red-500 p-4">Error loading feedback</div>

  return (
    <Card className="w-full bg-customgreys-darkGrey">
      <CardHeader>
        <CardTitle>Feedback Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg">
          {feedbacks?.length === 0 ? (
            <p className="text-gray-400">No feedback submitted yet for this course</p>
          ) : (
            <div className="space-y-4">
              {feedbacks?.map((feedback) => (
                <div key={feedback.feedbackId} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={feedback.status} />
                        <h3 className="font-medium">{feedback.username}</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Created: {new Date(feedback.createdAt).toLocaleDateString()}
                        {feedback.updatedAt && ` • Updated: ${new Date(feedback.updatedAt).toLocaleDateString()}`}
                      </p>
                      <span className="text-sm text-blue-400 block">
                        Type: {feedback.feedbackType}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span 
                        className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer underline"
                        onClick={() => handleFeedbackClick(
                            feedback.courseId,
                            feedback.sectionId,
                            feedback.chapterId
                        )}
                        >
                        {feedback.feedbackType === 'question' 
                            ? `Question: ${feedback.questionId}` 
                            : `Assignment: ${feedback.assignmentId}`}
                      </span>
                      {user?.publicMetadata.userType === 'teacher' && (
                        <Select
                          value={feedback.status}
                          onValueChange={(value) => handleStatusChange(feedback.feedbackId, value)}
                        >
                          <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="new" className="hover:bg-gray-700">
                              new
                            </SelectItem>
                            <SelectItem value="resolved" className="hover:bg-gray-700">
                              resolved
                            </SelectItem>
                            <SelectItem value="no_fault_found" className="hover:bg-gray-700">
                              no fault found
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {user?.publicMetadata.userType === 'teacher' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(feedback.feedbackId)}
                            disabled={isDeleting}
                          >
                            
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                    </div>
                  </div>
                  <p className="text-gray-300">{feedback.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FeedbackList