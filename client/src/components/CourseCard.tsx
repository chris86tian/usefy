"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { cn, getUserName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Archive, BarChartBig, ChevronDown, ChevronUp, Pencil, Trash2, Users, Lock, BookOpen, CheckCircle } from 'lucide-react'
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useGetCourseInstructorsQuery } from "@/state/api"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CourseCardProps {
  course: Course
  variant?: "admin" | "learner" | "instructor"
  isEnrolled?: boolean
  progress?: UserCourseProgress
  onView?: (course: Course) => void
  onEdit?: (course: Course) => void
  onDelete?: (course: Course) => void
  onArchive?: (course: Course) => void
  onUnarchive?: (course: Course) => void
  onStats?: (course: Course) => void
  onEnroll?: (course: Course) => void
  customActions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (course: Course) => void
  }>
}

export function CourseCard({
  course,
  variant = "learner",
  isEnrolled = false,
  progress,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onStats,
  onEnroll,
  customActions = [],
}: CourseCardProps) {
  const { user } = useUser()

  const [isInstructorsOpen, setIsInstructorsOpen] = useState(false)
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)

  const { data: instructors } = useGetCourseInstructorsQuery(course.courseId)

  const canEdit =
    variant === "admin" || (variant === "instructor" && instructors?.some((instructor) => instructor.id === user?.id))
  const showViewOnly = variant === "admin" && !canEdit && !isEnrolled

  const statusVariants = { Published: "default", Draft: "outline", Archived: "secondary" } as const

  const courseProgress = useMemo(() => {
    if (!progress || !course.sections || !isEnrolled || !user) return 0

    let totalItems = 0
    let completedItems = 0

    course.sections.forEach((section) => {
      section.chapters?.forEach((chapter) => {
        if (chapter.quiz) {
          totalItems++

          const sectionProgress = progress.sections?.find((s) => s.sectionId === section.sectionId)
          const chapterProgress = sectionProgress?.chapters?.find((c) => c.chapterId === chapter.chapterId)

          if (chapterProgress?.quizCompleted) {
            completedItems++
          }
        }
      })
    })

    course.sections.forEach((section) => {
      section.chapters?.forEach((chapter) => {
        if (chapter.assignments && chapter.assignments.length > 0) {
          chapter.assignments.forEach((assignment) => {
            totalItems++

            if (assignment.submissions && assignment.submissions.some((sub) => sub.userId === user.id)) {
              completedItems++
            }
          })
        }
      })
    })

    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  }, [course, progress, user, isEnrolled])

  const totalActivities = useMemo(() => {
    if (!course.sections) return 0

    let total = 0

    course.sections.forEach((section) => {
      section.chapters?.forEach((chapter) => {
        if (chapter.quiz) {
          total++
        }

        if (chapter.assignments) {
          total += chapter.assignments.length
        }
      })
    })

    return total
  }, [course])

  const handleClick = () => {
    if (!isEnrolled && variant === "learner") {
      setIsEnrollDialogOpen(true)
    } else if (onView && !showViewOnly && isEnrolled) {
      onView(course)
    }
  }

  const handleEnroll = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (onEnroll) {
      onEnroll(course)
      setIsEnrollDialogOpen(false)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(course)
    }
  }

  const formatLastAccessed = (timestamp: string) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }

  const lastAccessed = progress?.lastAccessedTimestamp ? formatLastAccessed(progress.lastAccessedTimestamp) : null

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-colors hover:bg-accent/50 border border-gray-200 group h-full flex flex-col",
          (onView || variant === "learner" || variant === "instructor") && isEnrolled && "cursor-pointer",
          showViewOnly && "opacity-70",
        )}
      >
        <CardHeader
          className={cn("p-0", (variant === "admin" || variant === "instructor") && !showViewOnly && isEnrolled && "cursor-pointer")}
          onClick={isEnrolled ? handleClick : undefined}
        >
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={course.image || "/placeholder.png"}
              alt={course.title}
              width={400}
              height={225}
              className="object-cover w-full h-full"
              priority
            />
            {(variant === "admin" || variant === "instructor") && (
              <Badge variant={statusVariants[course.status]} className="absolute top-2 right-2 text-white">
                {course.status}
              </Badge>
            )}
            {variant === "instructor" && (
              <Badge variant="outline" className="absolute top-2 left-2 bg-white/90">
                Instructor
              </Badge>
            )}
            {!isEnrolled && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3 flex-grow">
          <div>
            <div className="flex items-start justify-between mb-1">
              <CardTitle className="line-clamp-1 text-lg">{course.title}</CardTitle>
            </div>
          </div>

          {(variant === "admin" || variant === "instructor") && course.enrollments && (
            <Badge variant="outline" className="bg-primary/5">
              {course.enrollments.length} Enrolled
            </Badge>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {course.sections && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{course.sections.length} sections</span>
              </div>
            )}
            {totalActivities > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{totalActivities} activities</span>
              </div>
            )}
          </div>

          {isEnrolled && variant === "learner" && (
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium">Activities completed</span>
                <span className="text-primary font-medium">{Math.round(courseProgress)}%</span>
              </div>
              <Progress value={courseProgress} className="h-1.5" />
              {lastAccessed && <p className="text-xs text-muted-foreground mt-1">Last accessed: {lastAccessed}</p>}
            </div>
          )}

          <Collapsible open={isInstructorsOpen} onOpenChange={setIsInstructorsOpen} className="border rounded-md p-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-1 rounded">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {instructors && instructors.length > 0
                      ? `Instructors (${instructors.length})`
                      : "No Instructors Assigned"}
                  </span>
                </div>
                {isInstructorsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {instructors && instructors.length > 0 ? (
                instructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-center gap-2 pl-6 py-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={instructor.imageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getUserName(instructor)?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{getUserName(instructor)}</span>
                  </div>
                ))
              ) : (
                <div className="pl-6 py-1 text-sm text-muted-foreground">No instructors assigned</div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {variant === "admin" ? (
            <div className="flex flex-wrap gap-2 w-full">
              {canEdit ? (
                <>
                  {!isEnrolled && onEnroll && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnroll(e)
                      }}
                      className="mr-auto"
                    >
                      Enroll
                    </Button>
                  )}
                  {isEnrolled && onView && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(course)
                      }}
                      className="mr-auto"
                    >
                      View Course
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(course)
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onStats && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStats(course)
                      }}
                    >
                      <BarChartBig className="w-4 h-4 mr-2" />
                      Stats
                    </Button>
                  )}
                  {onArchive &&
                    onUnarchive &&
                    (course.status === "Published" || course.status === "Draft" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchive(course)
                        }}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUnarchive(course)
                        }}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Unarchive
                      </Button>
                    ))}
                  {variant === "admin" && onDelete && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(e)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}

                  {/* Custom Actions */}
                  {customActions.map((action, index) => (
                    <Button
                      key={`custom-action-${index}`}
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick(course)
                      }}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </>
              ) : (
                <>
                  {!isEnrolled && onEnroll && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnroll(e)
                      }}
                      className="mr-auto"
                    >
                      Enroll
                    </Button>
                  )}
                  {isEnrolled && onView && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(course)
                      }}
                      className="mr-auto"
                    >
                      View Course
                    </Button>
                  )}
                  {showViewOnly && <p className="text-sm text-muted-foreground italic text-center w-full">View Only</p>}
                </>
              )}
            </div>
          ) : variant === "instructor" ? (
            <div className="flex flex-wrap gap-2 w-full">
              {!isEnrolled && onEnroll && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEnroll(e)
                  }}
                  className="mr-auto"
                >
                  Enroll
                </Button>
              )}
              {isEnrolled && onView && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(course)
                  }}
                  className="mr-auto"
                >
                  View Course
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(course)
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onStats && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStats(course)
                  }}
                >
                  <BarChartBig className="w-4 h-4 mr-2" />
                  Stats
                </Button>
              )}
              {/* Custom Actions */}
              {customActions.map((action, index) => (
                <Button
                  key={`custom-action-${index}`}
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick(course)
                  }}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : isEnrolled ? (
            <Button onClick={handleClick} variant="default" className="w-full">
              {courseProgress > 0 ? "Continue Learning" : "Start Course"}
            </Button>
          ) : (
            onEnroll && (
              <Button onClick={handleEnroll} variant="outline" className="w-full font-semibold">
                Enroll
              </Button>
            )
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Course Access Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be enrolled in &quot;{course.title}&quot; to access its content. Would you like to enroll now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleEnroll()} className="bg-primary">
              Enroll Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
