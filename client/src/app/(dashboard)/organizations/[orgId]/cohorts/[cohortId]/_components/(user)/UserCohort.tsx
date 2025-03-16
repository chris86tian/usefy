"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/Header"
import { Toolbar } from "@/components/Toolbar"
import { CourseCard } from "@/components/CourseCard"
import { Archive } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { handleEnroll } from "@/lib/utils"
import { 
  useCreateTransactionMutation, 
  useGetMyUserCourseProgressesQuery, 
  useGetCohortQuery } from "@/state/api"
import { Spinner } from "@/components/ui/Spinner"
import type { User } from "@clerk/nextjs/server"
import ArchivedOverlay from "./_components/ArchivedOverlay"
import NotFound from "@/components/NotFound"
import { SignInRequired } from "@/components/SignInRequired"

interface UserCohortProps {
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  coursesLoading: boolean
  courses: Course[]
  refetch: () => void
}

const UserCohort = ({ orgUsers, coursesLoading, courses, refetch }: UserCohortProps) => {
  const { user } = useUser()
  const router = useRouter()
  const { orgId, cohortId } = useParams() as { orgId: string; cohortId: string }

  const { 
    data: cohort, 
    isLoading: cohortLoading 
  } = useGetCohortQuery({ organizationId: orgId, cohortId })
  const {
    data: progresses, 
    isLoading: progressesLoading 
  } = useGetMyUserCourseProgressesQuery(orgId)

  const [createTransaction] = useCreateTransactionMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const progressesByCourseId = useMemo(() => {
    if (!progresses) return {}

    return progresses.reduce(
      (acc, progress) => {
        acc[progress.courseId] = progress
        return acc
      },
      {} as Record<string, UserCourseProgress>,
    )
  }, [progresses])

  const isInstructor = orgUsers.instructors.some((instructor) => instructor.id === user?.id)
  const isLearner = orgUsers.learners.some((learner) => learner.id === user?.id)

  const filteredCourses = useMemo(() => {
    if (!courses) return []
  
    return courses.filter((course) => {
      // Base filters for search and archive status
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArchiveStatus = showArchived ? true : course.status !== "Archived"
      
      // Instructor filter - only show courses where the user is an instructor
      const isInstructorForCourse = isInstructor ? 
        course.instructors?.some(instructor => instructor.userId === user?.id) : 
        true // If not an instructor, don't apply this filter
      
      return matchesSearch && matchesArchiveStatus && isInstructorForCourse
    })
  }, [courses, searchTerm, showArchived, isInstructor, user?.id])

  const handleGoToCourse = (course: Course) => {
    if (course.status === "Archived") {
      toast.error("This course is archived and no longer available")
      return
    }

    if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
      const firstChapter = course.sections[0].chapters[0]
      router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, {
        scroll: false,
      })
    } else {
      router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}`, {
        scroll: false,
      })
    }
  }

  const handleCourseEnroll = (course: Course) => {
    if (!user) {
      toast.error("You must be logged in to enroll in courses")
      return
    }

    const isEnrolled = course.enrollments?.some((enrollment) => enrollment.userId === user.id)

    if (!isEnrolled) {
      handleEnroll(user.id, course.courseId, createTransaction)
        .then(() => {
          toast.success(`Successfully enrolled in ${course.title}`)
          if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
            router.push(
              `/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
            )
          }
          refetch()
        })
        .catch((error) => {
          console.error("Enrollment error:", error)
          toast.error("Failed to enroll in course")
        })
    } else {
      toast.info("You are already enrolled in this course")
    }
  }

  if (coursesLoading || cohortLoading || progressesLoading) return <Spinner />

  if (!user) return <SignInRequired />
  if (!cohort) return <NotFound message="Cohort not found" />

  const archivedCount = courses?.filter((course) => course.status === "Archived").length

  return (
    <div className="space-y-4">
      <Header title={cohort.name} subtitle={`${cohort.name} courses`} />

      <div className="flex justify-between items-center">
        <Toolbar onSearch={setSearchTerm} />

        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === user?.id)
            const courseProgress = progressesByCourseId[course.courseId]

            return (
              <div key={course.courseId} className="relative">
                <CourseCard
                  course={course}
                  variant={isInstructor ? "instructor" : isLearner ? "learner" : "learner"}
                  isEnrolled={isEnrolled}
                  progress={courseProgress}
                  onView={handleGoToCourse}
                  onEnroll={handleCourseEnroll}
                  onEdit={isInstructor ? () => router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/edit`) : undefined}
                  onStats={isInstructor ? () => router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/stats`) : undefined}
                />
                {course.status === "Archived" && <ArchivedOverlay />}
              </div>
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserCohort

