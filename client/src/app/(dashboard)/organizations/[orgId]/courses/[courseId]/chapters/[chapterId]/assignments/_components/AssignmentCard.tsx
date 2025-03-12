"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Edit, Code, Link as LinkIcon, ChevronDown, ExternalLink, UploadCloud, CheckCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useDeleteAssignmentMutation } from "@/state/api"
import { useParams, useRouter } from "next/navigation"
import AssignmentModal from "../_components/AssignmentModal"
import SubmissionModal from "../_components/SubmissionModal"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

const Description = ({ text }: { text: string }) => {
  const parts = text.split(/```([\s\S]*?)```/)
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({})

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const shouldCollapse = (text: string | string[]) => text.length > 100

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const isOpen = openSections[index] ?? false
          return (
            <div key={index} className="relative group">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSection(index)}
                className="w-full mb-1 flex items-center justify-between text-sm"
              >
                <span>Code Block {Math.ceil(index / 2)}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
              </Button>
              <Collapsible open={isOpen}>
                <CollapsibleContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto font-mono text-sm">
                    <code>{part.trim()}</code>
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        } else if (part.trim()) {
          const isOpen = openSections[index] ?? false
          const shouldCollapseText = shouldCollapse(part)

          if (!shouldCollapseText) {
            return (
              <p key={index} className="text-sm text-muted-foreground whitespace-pre-wrap">
                {part}
              </p>
            )
          }

          return (
            <div key={index}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between text-sm"
              >
                <span>Description</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
              </Button>
              <Collapsible open={isOpen}>
                <CollapsibleContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{part}</p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        }
        return null
      })}
    </>
  )
}

export function AssignmentCard({ assignment, isAuthorized, course, sectionId, chapter }: AssignmentCardProps) {
  const { user } = useUser()
  const { orgId } = useParams()
  const router = useRouter()
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)

  const hasSubmitted = user && assignment.submissions.some(
    (submission) => submission.userId === user.id
  )

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
      <Card className="overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="bg-gray-100 p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{assignment.title}</h3>
            </div>
            {isAuthorized && (
              <div className="flex items-center space-x-2">
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
                <Button variant="outline" size="icon" onClick={handleDelete} disabled={isDeleting} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <Description text={assignment.description} />

          {assignment.resources && assignment.resources.length > 0 ? (
            <Collapsible open={isResourcesOpen} onOpenChange={setIsResourcesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between mt-2">
                  Resources & Materials
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isResourcesOpen ? "transform rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-3">
                {assignment.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm text-gray-600">{resource.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => window.open(resource.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Alert>
              <AlertDescription>No additional resources provided for this assignment.</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="border-t bg-gray-100 py-3 flex justify-between dark:bg-gray-800">
          <Button 
            onClick={handleAssignment} 
            className="w-full"
            variant={hasSubmitted ? "outline" : "default"}
          >
            {hasSubmitted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                View Submission
              </>
            ) : assignment.isCoding ? (
              <>
                <Code className="h-4 w-4 mr-2" />
                Start Coding
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

