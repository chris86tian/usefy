"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { cn, getUserName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Archive, BarChartBig, ChevronDown, ChevronUp, Pencil, Trash2, Users } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetCourseInstructorsQuery } from "@/state/api"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface AdminCourseCardProps {
  course: Course
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
  onView: (course: Course) => void
  onArchive: (course: Course) => void
  onUnarchive: (course: Course) => void
  onStats: (course: Course) => void
  isOwner: boolean
}

export function AdminCourseCard({
  course,
  onEdit,
  onDelete,
  onView,
  onArchive,
  onUnarchive,
  onStats,
  isOwner,
}: AdminCourseCardProps) {
  const { user } = useUser()
  const [isInstructorsOpen, setIsInstructorsOpen] = useState(false)

  const { data: instructors } = useGetCourseInstructorsQuery(course.courseId)

  const isInstructor = instructors?.some((instructor) => instructor.id === user?.id)

  const isUserEnrolled = course.enrollments?.some((enrollment) => enrollment.userId === user?.id)

  const canEdit = isOwner || isInstructor
  const showViewOnly = !canEdit && !isUserEnrolled

  const statusVariants = {
    Published: "default",
    Draft: "outline",
    Archived: "secondary",
  } as const

  return (
    <Card
      className={cn(
        "m-2 group overflow-hidden transition-colors border border-gray-200 hover:bg-accent",
        showViewOnly && "opacity-50",
      )}
    >
      <CardHeader
        className={cn("p-0", !showViewOnly && "cursor-pointer")}
        onClick={() => {
          if (!showViewOnly) {
            onView(course)
          }
        }}
      >
        <div className="aspect-video relative overflow-hidden">
          <Image src={course.image || "/placeholder.png"} alt={course.title} width={460} height={400} priority />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="line-clamp-1">{course.title}</CardTitle>
              <CardDescription className="line-clamp-1">{course.category}</CardDescription>
            </div>
            <Badge variant={statusVariants[course.status]}>{course.status}</Badge>
          </div>

          {course.enrollments && (
            <Badge variant="outline" className="bg-primary/5">
              {course.enrollments.length} Enrolled
            </Badge>
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
                    <span className="text-sm">{getUserName(instructor)}</span>
                  </div>
                ))
              ) : (
                <div className="pl-6 py-1 text-sm text-muted-foreground">
                  No instructors assigned
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => onEdit(course)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onStats(course)}>
                <BarChartBig className="w-4 h-4 mr-2" />
                Stats
              </Button>
              {course.status === "Published" || course.status === "Draft" ? (
                <Button variant="secondary" size="sm" onClick={() => onArchive(course)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => onUnarchive(course)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Unarchive
                </Button>
              )}
              {isOwner && (
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
      </CardContent>
    </Card>
  )
}

