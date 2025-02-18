"use client"

import { useUser } from "@clerk/nextjs"
import { useGetFeedbackQuery } from "@/state/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const FeedbackList = () => {
  const { user } = useUser()
  const { data: feedbacks, isLoading, error } = useGetFeedbackQuery(user?.id ?? '');

  if (isLoading) return <div>Loading feedback...</div>
  if (error) return <div>Error loading feedback</div>

  return (
    <Card className="w-3/4 bg-customgreys-darkGrey">
      <CardHeader>
        <CardTitle>Your Feedback Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4"></h2>
        {feedbacks?.length === 0 ? (
            <p>No feedback submitted yet</p>
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
                    <span className="text-sm text-blue-400">
                    Course: {feedback.courseId}
                    </span>
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