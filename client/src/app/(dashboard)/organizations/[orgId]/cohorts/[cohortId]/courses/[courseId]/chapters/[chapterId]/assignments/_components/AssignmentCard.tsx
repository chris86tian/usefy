"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Edit, Code, Link as LinkIcon, ExternalLink, UploadCloud, CheckCircle, Clock } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useDeleteAssignmentMutation } from "@/state/api"
import { useParams, useRouter } from "next/navigation"
import AssignmentModal from "../_components/AssignmentModal"
import SubmissionModal from "../_components/SubmissionModal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import FeedbackButton from "../../adaptive-quiz/FeedbackButton"
import { formatDistanceToNow } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserName } from "@/lib/utils"

interface AssignmentCardProps {
  assignment: Assignment
  isAuthorized: boolean
  sectionId: string
  chapter: Chapter
  course: {
    courseId: string
    instructors?: { userId: string }[]
  }
}

const AssignmentDescription = ({ text }: { text: string }) => {
  const cleanText = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `Code example: ${code.trim().split('\n').join(' ').substring(0, 50)}...`;
  });

  return (
    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
      {cleanText}
    </div>
  );
}

export function AssignmentCard({ assignment, isAuthorized, course, sectionId, chapter }: AssignmentCardProps) {
  const { user } = useUser()
  const { orgId } = useParams()
  const router = useRouter()
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("description")

  const userSubmission = assignment.submissions.find((submission) => submission.userId === user?.id)
  const hasSubmitted = Boolean(userSubmission)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteAssignment({
        assignmentId: assignment.assignmentId,
        courseId: course.courseId,
        sectionId,
        chapterId: chapter.chapterId,
      }).unwrap()
    } catch (error) {
      console.error("Failed to delete assignment:", error)
    }
  }

  const handleAssignment = () => {
    if (assignment.isCoding) {
      router.push(
        `/organizations/${orgId}/courses/${course.courseId}/chapters/${chapter.chapterId}/code?courseId=${course.courseId}&sectionId=${sectionId}&chapterId=${chapter.chapterId}&assignmentId=${assignment.assignmentId}`,
      )
    } else {
      setIsSubmissionModalOpen(true)
    }
  }

  return (
    <>
      <Card className="overflow-hidden border border-gray-200 shadow-md">
        <CardHeader className={`${hasSubmitted ? 'bg-green-50' : 'bg-gray-100'} p-4 dark:bg-gray-800`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasSubmitted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
              <div>
                <h3 className="font-semibold text-lg">{assignment.title}</h3>
                {assignment.isCoding && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Code className="h-3 w-3 mr-1" /> Coding Assignment
                  </Badge>
                )}
              </div>
            </div>
            {isAuthorized && (
              <div className="flex items-center space-x-2">
                <FeedbackButton
                  feedbackType="assignment"
                  itemId={assignment.assignmentId}
                  courseId={course.courseId}
                  sectionId={sectionId}
                  chapterId={chapter.chapterId}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditModalOpen(true)
                  }}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleDelete} 
                  disabled={isDeleting} 
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="p-2 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="resources">Resources {assignment.resources?.length ? `(${assignment.resources.length})` : ''}</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-4">
            <TabsContent value="description" className="mt-0 space-y-4">
              <AssignmentDescription text={assignment.description} />
              
              {hasSubmitted && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <span className="font-medium text-green-700">Submitted</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resources" className="mt-0">
              {assignment.resources && assignment.resources.length > 0 ? (
                <div className="space-y-3">
                  {assignment.resources.map((resource, index) => (
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{resource.title}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No additional resources provided for this assignment.</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="border-t bg-gray-50 py-4 px-4 dark:bg-gray-800">
          <Button 
            onClick={handleAssignment} 
            className="w-full" 
            variant={hasSubmitted ? "outline" : "default"}
          >
            {hasSubmitted ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                View Submission
              </>
            ) : assignment.isCoding ? (
              <>
                <Code className="h-4 w-4 mr-2" />
                Start Coding Assignment
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4 mr-2" />
                Submit Assignment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isEditModalOpen && (
        <AssignmentModal
          mode="edit"
          assignment={assignment}
          chapter={chapter}
          courseId={course.courseId}
          sectionId={sectionId}
          onAssignmentChange={() => {
            setIsEditModalOpen(false)
            router.refresh()
          }}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}

      {isSubmissionModalOpen && (
        <SubmissionModal
          assignment={assignment}
          courseId={course.courseId}
          sectionId={sectionId}
          chapterId={chapter.chapterId}
          open={isSubmissionModalOpen}
          onOpenChange={setIsSubmissionModalOpen}
          onSubmissionComplete={() => {
            setIsSubmissionModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

export default AssignmentCard