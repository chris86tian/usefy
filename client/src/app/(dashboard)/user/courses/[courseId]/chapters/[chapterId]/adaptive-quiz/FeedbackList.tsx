"use client"

import { useGetFeedbackQuery } from "@/state/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface FeedbackListProps {
  courseId: string
}

const FeedbackList = ({ courseId }: FeedbackListProps) => {
  const { data: feedbacks, isLoading, error } = useGetFeedbackQuery(courseId)

  if (isLoading) return <div>Loading feedback...</div>
  if (error) return <div>Error loading feedback</div>

  return (
    <Card className="w-full bg-customgreys-darkGrey">
      <CardHeader>
        <CardTitle>Feedback Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg">
          {feedbacks?.length === 0 ? (
            <p>No feedback submitted yet for this course</p>
          ) : (
            <div className="space-y-4">
              {feedbacks?.map((feedback) => (
                <div key={feedback.feedbackId} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{feedback.username}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-blue-400">
                        Section: {feedback.sectionId}
                      </span>
                      <span className="text-sm text-blue-400">
                        Chapter: {feedback.chapterId}
                      </span>
                      <span className="text-sm text-blue-400">
                        Question: {feedback.questionId}
                      </span>
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