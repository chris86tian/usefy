import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
interface CourseCardProps {
  course: Course;
  onGoToCourse: (course: Course) => void;
}

const CourseCard = ({ course, onGoToCourse }: CourseCardProps) => {
  return (
    <Card 
      onClick={() => onGoToCourse(course)}
      className="overflow-hidden transition-all duration-300 bg-white hover:shadow-lg group cursor-pointer"
    >
      <CardHeader className="p-0">
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={course.image || "/api/placeholder/400/300"}
            alt={course.title}
            width={400}
            height={300}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4 bg-gray-900">
        <div className="space-y-2">
          <Badge 
            variant="secondary" 
            className="font-normal text-xs px-2.5 py-0.5 bg-blue-50 text-black"
          >
            {course.category}
          </Badge>
          
          <CardTitle className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-gray-500 transition-colors">
            {course.title}
          </CardTitle>
          
          <p className="text-sm text-gray-500 line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
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
      </CardContent>
    </Card>
  );
};

export default CourseCard;