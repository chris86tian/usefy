import type React from "react"
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useGetUserQuery } from "@/state/api"
import { getUserName } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  onGoToCourse: (course: Course) => void
  onEnroll: (courseId: string) => void
  isEnrolled: boolean
}

const CourseCard = ({ course, onGoToCourse, onEnroll, isEnrolled }: CourseCardProps) => {
  const instructorId = course.instructors?.[0]?.userId || "";
  const { data: instructor } = useGetUserQuery(instructorId, { skip: !instructorId });
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onGoToCourse(course)
  }

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEnroll(course.courseId)
  }

  return (
    <Card onClick={handleClick} className="overflow-hidden transition-colors hover:bg-accent cursor-pointer group">
      <CardHeader className="p-0">
        <div className="aspect-video relative overflow-hidden">
          <Image src={course.image || "/placeholder.png"} alt={course.title} width={420} height={350} priority />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          <div className="flex items-center gap-2">
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
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Badge variant="secondary" className="hover:bg-secondary">
          {course.category}
        </Badge>
      </CardFooter>
      {!isEnrolled && (
          <Button onClick={handleEnroll} variant="default" className="w-full">
            Enroll Now
          </Button>
      )}
    </Card>
  )
}

export default CourseCard

