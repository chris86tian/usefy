import { LayoutDashboard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EmptyCourseProps {
  courseName: string
}

const EmptyCourse = ({ courseName }: EmptyCourseProps) => {
  return (
    <Card className="w-full max-w-3xl mx-auto bg-gray-900">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{courseName}</CardTitle>
        <CardDescription className="text-center">This section is still being prepared</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <LayoutDashboard className="w-24 h-24 mb-4 text-gray-500" />
        <p className="text-lg text-center">No chapters have been added yet.</p>
        <p className="text-sm text-muted-foreground text-center">
          Check back later for updates or contact the course instructor for more information.
        </p>
      </CardContent>
    </Card>
  )
}

export default EmptyCourse
