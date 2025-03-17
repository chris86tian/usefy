"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetCourseQuery } from "@/state/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Book, Users, Layers, FileText } from "lucide-react"
import ChapterStats from "./ChapterStats";

interface CourseStatsProps {
  courseId: string
}

export default function CourseStats({ courseId }: CourseStatsProps) {
  const { data: course, isLoading } = useGetCourseQuery(courseId)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!course) {
    return <div>No course data available.</div>
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Enrollments"
          value={course.enrollments?.length || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="Students enrolled in the course"
        />
        <StatCard
          title="Total Sections"
          value={course.sections.length}
          icon={<Book className="h-4 w-4 text-muted-foreground" />}
          description="Number of course sections"
        />
        <StatCard
          title="Total Chapters"
          value={course.sections.reduce((acc, section) => acc + section.chapters.length, 0)}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="Total chapters across all sections"
        />
      </div>
      <div className="container py-8 space-y-8">
        <h1 className="text-2xl font-bold">{course?.title}</h1>
        
        {course?.sections.map((section) => (
          <div key={section.sectionId} className="space-y-6">
            <h2 className="text-xl font-semibold">Section: {section.sectionTitle}</h2>
            {section.chapters.map((chapter) => (
              <div key={chapter.chapterId} className="bg-card p-2 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Chapter: {chapter.title}</h3>
                <ChapterStats 
                  courseId={course.courseId} 
                  chapterId={chapter.chapterId} 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div> 
  )
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  description: string
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card className="">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-4 w-[120px] mt-2" />
          </CardContent>
        </Card>
      ))}
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

