import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { cn, getUserName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Archive, BarChartBig, Pencil, Trash2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetUserQuery } from "@/state/api"

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
  
  const instructorId = course.instructors?.[0]?.userId || "";
  const { data: instructor } = useGetUserQuery(instructorId, { skip: !instructorId });

  // Check if the current user is an instructor for this course
  const isInstructor = course.instructors?.some(
    (instructor) => instructor.userId === user?.id
  );

  const isUserEnrolled = course.enrollments?.some((enrollment) => enrollment.userId === user?.id)
  
  // Determine view permissions
  const canEdit = isOwner || isInstructor;
  const showViewOnly = !canEdit && !isUserEnrolled;

  const statusVariants = {
    Published: "default",
    Draft: "outline",
    Archived: "secondary",
  } as const

  return (
    <Card className={cn("m-2 group overflow-hidden transition-colors border border-gray-200 hover:bg-accent", showViewOnly && "opacity-50")}>
      <CardHeader
        className={cn("p-0", !showViewOnly && "cursor-pointer")}
        onClick={() => {
          if (!showViewOnly) {
            onView(course)
          }
        }}
      >
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={course.image || "/placeholder.png"}
            alt={course.title}
            width={460}
            height={400}
            priority
          />
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

          {instructor?.id ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={instructor.imageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getUserName(instructor)?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{getUserName(instructor)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  N/A
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">No Instructor Assigned</span>
            </div>
          )}
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