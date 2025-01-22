import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";

interface CourseCardProps {
  course: Course;
  onGoToCourse: (course: Course) => void;
}

const CourseCard = ({ course, onGoToCourse }: CourseCardProps) => {
  return (
    <Card className="course-card group" onClick={() => onGoToCourse(course)}>
      <CardHeader className="course-card__header">
        <Image
          src={course.image || "/placeholder.png"}
          alt={course.title}
          width={400}
          height={350}
          className="course-card__image"
          priority
        />
      </CardHeader>
      <CardContent className="course-card__content">
        <CardTitle className="course-card__title">
          {course.title}: {course.description}
        </CardTitle>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.teacherName}`}
                alt={course.teacherName} 
              />
              <AvatarFallback className="bg-blue-50 text-blue-600">
                {course.teacherName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">
                {course.teacherName}
              </span>
              <span className="text-xs text-gray-500">
                Instructor
              </span>
            </div>
          </div>
        </div>

        <CardFooter className="course-card__footer">
          <div className="course-card__category">{course.category}</div>
          <span className="course-card__price">
            {course.level}
          </span>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default CourseCard;