"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Edit, Code, LinkIcon, Users, ChevronDown, ExternalLink, UploadCloud, CheckCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useDeleteAssignmentMutation } from "@/state/api"
import { useParams, useRouter } from "next/navigation"
import AssignmentModal from "../_components/AssignmentModal"
import SubmissionModal from "../_components/SubmissionModal"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AssignmentCardProps {
  assignment: Assignment
  course: {
    courseId: string
    instructors?: { userId: string }[]
  }
  sectionId: string
  chapterId: string
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
    <div className="space-y-2">
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
    </div>
  )
}

export function AssignmentCard({ assignment, course, sectionId, chapterId }: AssignmentCardProps) {
  const { user } = useUser()
  const router = useRouter()
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const { orgId } = useParams()

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
        chapterId,
      }).unwrap()
    } catch (error) {
      console.error("Failed to delete assignment:", error)
    }
  }

  const handleAssignment = () => {
    if (assignment.isCoding) {
      router.push(
        `/organizations/${orgId}/courses/${course.courseId}/chapters/${chapterId}/code?courseId=${course.courseId}&sectionId=${sectionId}&chapterId=${chapterId}&assignmentId=${assignment.assignmentId}`,
      )
    } else {
      setIsSubmissionModalOpen(true)
    }
  }

  return (
    <>
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{assignment.title}</h3>
            </div>
            {course?.instructors?.some((instructor) => instructor.userId === user?.id) && (
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

        <CardContent>
          <Description text={assignment.description} />

          <div className="flex items-center space-x-2 text-sm text-muted-foreground my-4">
            <Users className="h-4 w-4" />
            <span>{assignment.submissions.length} Submissions</span>
          </div>

          {assignment.resources && assignment.resources.length > 0 ? (
            <Collapsible open={isResourcesOpen} onOpenChange={setIsResourcesOpen} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Resources & Materials
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isResourcesOpen ? "transform rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-3">
                {assignment.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">{resource.title}</span>
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

        <CardFooter>
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
          courseId={course.courseId}
          sectionId={sectionId}
          chapterId={chapterId}
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
          chapterId={chapterId}
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

