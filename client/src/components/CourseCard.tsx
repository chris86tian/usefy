import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface CourseCardProps {
  course: Course
  onGoToCourse: (course: Course) => void
}

const CourseCard = ({ course, onGoToCourse }: CourseCardProps) => {
  return (
    <Card
      onClick={() => onGoToCourse(course)}
      className="overflow-hidden transition-colors hover:bg-accent cursor-pointer group"
    >
      <CardHeader className="p-0">
        <div className="aspect-video relative overflow-hidden">
        <Image
          src={course.image || "/placeholder.png"}
          alt={course.title}
          width={420}
          height={350}
          priority
        />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">{course.teacherName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{course.teacherName}</span>
              <span className="text-xs text-muted-foreground">Instructor</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Badge variant="secondary" className="hover:bg-secondary">
          {course.category}
        </Badge>
        <span className="text-sm font-medium text-muted-foreground">{course.level}</span>
      </CardFooter>
    </Card>
  )
}

export default CourseCard