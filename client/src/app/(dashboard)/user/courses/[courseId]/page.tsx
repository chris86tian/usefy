import { Settings } from 'lucide-react'

interface EmptyCourseProps {
  courseName: string
}

const EmptyCourse = ({ courseName }: EmptyCourseProps) => {
  console.log(courseName)
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Settings size={64} className="text-gray-400" />
      <h2 className="text-2xl font-semibold mt-6">
        This section is still being prepared.
      </h2>
      <p className="text-gray-300 mt-2 text-center">
        Check back soon!
      </p>
    </div>
  )
}

export default EmptyCourse
