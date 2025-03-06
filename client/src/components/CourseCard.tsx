"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { cn, getUserName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Archive, BarChartBig, ChevronDown, ChevronUp, Pencil, Trash2, Users } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetCourseInstructorsQuery } from "@/state/api"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CourseCardProps {
  course: Course
  variant?: "admin" | "learner"
  isOwner?: boolean
  isEnrolled?: boolean
  onView?: (course: Course) => void
  onEdit?: (course: Course) => void
  onDelete?: (course: Course) => void
  onArchive?: (course: Course) => void
  onUnarchive?: (course: Course) => void
  onStats?: (course: Course) => void
  onEnroll?: (courseId: string) => void
}

export function CourseCard({
  course,
  variant = "learner",
  isOwner = false,
  isEnrolled = false,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onStats,
  onEnroll,
}: CourseCardProps) {
  const { user } = useUser()
  const [isInstructorsOpen, setIsInstructorsOpen] = useState(false)

  const { data: instructors } = useGetCourseInstructorsQuery(course.courseId)

  const isInstructor = instructors?.some((instructor) => instructor.id === user?.id)
  const canEdit = isOwner || isInstructor
  const showViewOnly = variant === "admin" && !canEdit && !isEnrolled

  const statusVariants = {
    Published: "default",
    Draft: "outline",
    Archived: "secondary",
  } as const

  const handleClick = () => {
    if (onView && !showViewOnly) {
      onView(course)
    }
  }

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEnroll) {
      onEnroll(course.courseId)
    }
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors hover:bg-accent/50 border border-gray-200 group",
        (onView || variant === "learner") && "cursor-pointer",
        showViewOnly && "opacity-70",
      )}
      onClick={variant === "learner" ? handleClick : undefined}
    >
      <CardHeader
        className={cn("p-0", variant === "admin" && !showViewOnly && "cursor-pointer")}
        onClick={variant === "admin" ? handleClick : undefined}
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
          {variant === "admin" && (
            <Badge variant={statusVariants[course.status]} className="absolute top-2 right-2">
              {course.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between mb-1">
            <CardTitle className="line-clamp-1 text-lg">{course.title}</CardTitle>
            {variant === "learner" && (
              <Badge variant="secondary" className="ml-2">
                {course.category}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-1">
            {variant === "admin" ? course.category : course.description}
          </CardDescription>
        </div>

        {/* Enrollment badge for admin view */}
        {variant === "admin" && course.enrollments && (
          <Badge variant="outline" className="bg-primary/5">
            {course.enrollments.length} Enrolled
          </Badge>
        )}

        {/* Instructors collapsible for all views */}
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
                  <span className="text-sm">{getUserName(instructor)}</span>
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
                {onEdit && (
                  <Button variant="secondary" size="sm" onClick={() => onEdit(course)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onStats && (
                  <Button variant="secondary" size="sm" onClick={() => onStats(course)}>
                    <BarChartBig className="w-4 h-4 mr-2" />
                    Stats
                  </Button>
                )}
                {onArchive &&
                  onUnarchive &&
                  (course.status === "Published" || course.status === "Draft" ? (
                    <Button variant="secondary" size="sm" onClick={() => onArchive(course)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => onUnarchive(course)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Unarchive
                    </Button>
                  ))}
                {isOwner && onDelete && (
                  <Button variant="destructive" size="sm" onClick={() => onDelete(course)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            ) : (
              showViewOnly && <p className="text-sm text-muted-foreground italic text-center w-full">View Only</p>
            )}
          </div>
        ) : (
          !isEnrolled &&
          onEnroll && (
            <Button onClick={handleEnroll} variant="default" className="w-full">
              Enroll Now
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
}

export default CourseCard

