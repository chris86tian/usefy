import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import AccordionSections from "./AccordionSections"

interface CoursePreviewProps {
  course: Course
}

const CoursePreview = ({ course }: CoursePreviewProps) => {
  const price = formatPrice(course.price)
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <Image src={course.image || "/placeholder.png"} alt="Course Preview" layout="fill" objectFit="cover" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{course.title}</h2>
          <p className="text-muted-foreground">by {course.teacherName}</p>
          <p className="text-sm text-muted-foreground mt-2">{course.description}</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Course Content</h4>
          <AccordionSections sections={course.sections} />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-xl font-semibold mb-4">Price Details (1 item)</h3>
        <div className="flex justify-between mb-4 text-muted-foreground">
          <span className="font-medium">1x {course.title}</span>
          <span className="font-medium">{price}</span>
        </div>
        <div className="flex justify-between border-t pt-4">
          <span className="font-bold text-lg">Total Amount</span>
          <span className="font-bold text-lg">{price}</span>
        </div>
      </div>
    </div>
  )
}

export default CoursePreview

