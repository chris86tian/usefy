'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useGetCourseQuery } from "@/state/api"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CourseStatsProps {
  courseId: string
}

export default function CourseStats({ courseId }: CourseStatsProps) {
  const { data: course } = useGetCourseQuery(courseId)

  if (!course) {
    return <div>Loading course statistics...</div>
  }

  const enrollmentData = course.sections.map((section, index) => ({
    name: `Section ${index + 1}`,
    enrollments: section.chapters.reduce((acc, chapter) => 
      acc + (chapter.type === 'Quiz' ? chapter.quiz?.questions.length || 0 : 0), 0),
  }))

  const contentTypeData = [
    { name: 'Text', value: course.sections.flatMap(s => s.chapters).filter(c => c.type === 'Text').length },
    { name: 'Quiz', value: course.sections.flatMap(s => s.chapters).filter(c => c.type === 'Quiz').length },
    { name: 'Video', value: course.sections.flatMap(s => s.chapters).filter(c => c.type === 'Video').length },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{course.enrollments?.length || 0}</div>
        </CardContent>
      </Card>
      <Card className="bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Course Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{course.level}</div>
        </CardContent>
      </Card>
      <Card className="bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{course.sections.length}</div>
        </CardContent>
      </Card>
      <Card className="bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {course.sections.reduce((acc, section) => acc + section.chapters.length, 0)}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-2 bg-gray-900">
        <CardHeader>
          <CardTitle>Enrollments by Section</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ChartContainer
            config={{
              enrollments: {
                label: "Enrollments",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={enrollmentData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="enrollments" fill="var(--color-enrollments)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 bg-gray-900">
        <CardHeader>
          <CardTitle>Content Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
            {/* White bars */}
          <ChartContainer
            config={{
              value: {
                label: "Count",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={contentTypeData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

