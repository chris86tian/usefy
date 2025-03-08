"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookCheck, BookOpen, ChevronRight, PlayCircle } from "lucide-react"
import CommitGraph from "@/components/CommitGraph"
import { useGetMyUserCourseProgressesQuery, useGetOrganizationCoursesQuery } from "@/state/api"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

interface UserDashboardProps {
  orgId: string
  recentActivities: any[]
}

const UserDashboard = ({ orgId, recentActivities }: UserDashboardProps) => {
  const { data: progresses, isLoading: progressesLoading } = useGetMyUserCourseProgressesQuery(orgId)
  const { data: courses, isLoading: coursesLoading } = useGetOrganizationCoursesQuery(orgId)
  const router = useRouter()

  const isLoading = progressesLoading || coursesLoading

  // Filter courses by status
  const getFilteredCourses = (status: "inProgress" | "completed" | "saved") => {
    if (!progresses || !courses) return []

    // Map courses with their progress data
    const coursesWithProgress = courses.map((course) => {
      const progress = progresses.find((p) => p.courseId === course.courseId)
      return {
        ...course,
        progress: progress || null,
      }
    })

    switch (status) {
      case "inProgress":
        return coursesWithProgress.filter(
          (course) => course.progress && course.progress.overallProgress > 0 && course.progress.overallProgress < 100,
        )
      case "completed":
        return coursesWithProgress.filter((course) => course.progress && course.progress.overallProgress === 100)
      case "saved":
        return coursesWithProgress.filter((course) => course.progress && course.progress.overallProgress === 0)
      default:
        return []
    }
  }

  // Find the last accessed chapter for a course
  const findLastAccessedChapter = (progress: UserCourseProgress) => {
    if (!progress || !progress.sections) return null

    // Flatten all chapters from all sections
    const allChapters = progress.sections.flatMap((section) =>
      section.chapters.map((chapter) => ({
        sectionId: section.sectionId,
        ...chapter,
      })),
    )

    // Find the first incomplete chapter
    const firstIncompleteChapter = allChapters.find((chapter) => !chapter.completed)

    if (firstIncompleteChapter) {
      return {
        sectionId: firstIncompleteChapter.sectionId,
        chapterId: firstIncompleteChapter.chapterId,
      }
    }

    // If all chapters are complete, return the last chapter
    if (allChapters.length > 0) {
      const lastChapter = allChapters[allChapters.length - 1]
      return {
        sectionId: lastChapter.sectionId,
        chapterId: lastChapter.chapterId,
      }
    }
    
    return null
  }

  const handleResume = (courseId: string, progress: UserCourseProgress) => {
    const lastChapter = findLastAccessedChapter(progress)
    console.log("Last chapter", lastChapter)

    if (lastChapter) {
      router.push(`/organizations/${orgId}/courses/${courseId}/chapters/${lastChapter.chapterId}`)
    } else {
      // If no chapter found, just go to the course page
      router.push(`/organizations/${orgId}/courses/${courseId}`)
    }
  }

  const handleViewAllCourses = () => {
    router.push(`/organizations/${orgId}/courses`)
  }

  return (
    <div className="space-y-6">
      {/* My Learning */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Learning</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary" onClick={handleViewAllCourses}>
              View all courses <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Track your progress across all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inProgress">
            <TabsList className="mb-4">
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>

            <TabsContent value="inProgress">
              {isLoading ? (
                <CourseCardSkeleton count={2} />
              ) : (
                <div className="space-y-4">
                  {getFilteredCourses("inProgress").length > 0 ? (
                    getFilteredCourses("inProgress").map((course) => (
                      <CourseCard
                        key={course.courseId}
                        course={course}
                        progress={course.progress}
                        onResume={() => handleResume(course.courseId, course.progress as UserCourseProgress)}
                        onClick={() => router.push(`/organizations/${orgId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<BookOpen className="h-12 w-12 mx-auto mb-2" />}
                      title="No courses in progress"
                      description="Start learning by enrolling in a course."
                    />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {isLoading ? (
                <CourseCardSkeleton count={1} />
              ) : (
                <div className="space-y-4">
                  {getFilteredCourses("completed").length > 0 ? (
                    getFilteredCourses("completed").map((course) => (
                      <CourseCard
                        key={course.courseId}
                        course={course}
                        progress={course.progress}
                        onClick={() => router.push(`/organizations/${orgId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<BookCheck className="h-12 w-12 mx-auto mb-2" />}
                      title="No completed courses"
                      description="Your completed courses will appear here."
                    />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved">
              {isLoading ? (
                <CourseCardSkeleton count={1} />
              ) : (
                <div className="space-y-4">
                  {getFilteredCourses("saved").length > 0 ? (
                    getFilteredCourses("saved").map((course) => (
                      <CourseCard
                        key={course.courseId}
                        course={course}
                        progress={course.progress}
                        onClick={() => router.push(`/organizations/${orgId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<BookOpen className="h-12 w-12 mx-auto mb-2" />}
                      title="No saved courses"
                      description="You can bookmark courses to save them for later."
                    />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <CommitGraph />
      </div>
    </div>
  )
}

interface CourseCardProps {
  course: any
  progress: UserCourseProgress | null
  onResume?: () => void
  onClick?: () => void
}

const CourseCard = ({ course, progress, onResume, onClick }: CourseCardProps) => {
  console.log("Course", course)
  const progressPercentage = progress?.overallProgress || 0
  const lastAccessed = progress?.lastAccessedTimestamp
    ? formatDistanceToNow(new Date(progress.lastAccessedTimestamp), { addSuffix: true })
    : null

  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
            {course.image === '' ? (
              <Image
                src={course.image || "/placeholder.png"}
                alt={course.title}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{course.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{course.description}</p>
              </div>
              {onResume && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResume()
                  }}
                >
                  <PlayCircle className="mr-1 h-4 w-4" />
                  Resume
                </Button>
              )}
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {progressPercentage === 100
                    ? "Completed"
                    : progressPercentage > 0
                      ? `${progressPercentage}% complete`
                      : "Not started"}
                </span>
                {lastAccessed && <span className="text-xs text-muted-foreground">Last accessed {lastAccessed}</span>}
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

const EmptyState = ({ icon, title, description }: EmptyStateProps) => {
  return (
    <div className="text-center py-6 text-muted-foreground">
      {icon}
      <p>{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  )
}

const CourseCardSkeleton = ({ count = 1 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}

export default UserDashboard

