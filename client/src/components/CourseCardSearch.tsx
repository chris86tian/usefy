import { formatPrice } from "@/lib/utils"
import Image from "next/image"

interface SearchCourseCardProps {
  course: Course
  isSelected: boolean
  onClick: () => void
}

const CourseCardSearch = ({ course, isSelected, onClick }: SearchCourseCardProps) => {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? "border-blue-500 shadow-lg" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      {/* Course Image */}
      <div className="relative w-full h-40 rounded-md overflow-hidden mb-4">
        <Image
          src={course.image || "/placeholder.png"} // Ensure there's a fallback image
          alt={course.title}
          width={420}
          height={350}
          objectFit="cover"
          className="rounded-md"
        />
      </div>

      {/* Course Details */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{course.description}</p>

      {/* Instructor & Price */}
      {/* <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">By {course.instructors[0].userId}</p> */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-primary font-semibold">{formatPrice(course.price)}</span>
        <span className="text-sm text-gray-500">{course.enrollments?.length || 0} Enrolled</span>
      </div>
    </div>
  )
}

export default CourseCardSearch
