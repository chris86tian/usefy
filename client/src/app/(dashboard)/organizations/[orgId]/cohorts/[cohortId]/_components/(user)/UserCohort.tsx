"use client"

import { useState, useMemo, useEffect } from "react"
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
  useGetCohortQuery,
  useGetCohortLearnersQuery
} from "@/state/api"
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
  const router = useRouter()
  const { user } = useUser()
  const { orgId, cohortId } = useParams() as { orgId: string; cohortId: string }

  const { data: cohort, isLoading: cohortLoading } = useGetCohortQuery({ organizationId: orgId, cohortId })
  const { data: progresses, isLoading: progressesLoading } = useGetMyUserCourseProgressesQuery(orgId)
  const { data: cohortLearners, isLoading: learnersLoading } = useGetCohortLearnersQuery({ organizationId: orgId, cohortId })

  const [createTransaction, { isLoading: createTransactionLoading }] = useCreateTransactionMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)

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
  const isAdmin = orgUsers.admins.some((admin) => admin.id === user?.id)

  console.log(isInstructor)
  console.log(isLearner)
  console.log(isAdmin)

  const filteredCourses = useMemo(() => {
    if (!courses) return []

    const validCourses = courses.filter((course) => course !== null)

    return validCourses.filter((course) => {
      if (!course) return false

      const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false

      let statusFilter = true
      if (isInstructor) {
        statusFilter = showArchived ? true : course.status !== "Archived"
      } else {
        statusFilter = course.status === "Published"
      }

      const isInstructorForCourse = isInstructor
        ? course.instructors?.some((instructor) => instructor.userId === user?.id)
        : true

      return matchesSearch && statusFilter && isInstructorForCourse
    })
  }, [courses, searchTerm, showArchived, isInstructor, user?.id])

  if (coursesLoading || cohortLoading || progressesLoading || learnersLoading) return <Spinner />
  if (!user) return <SignInRequired />
  if (!cohort) return <NotFound message="Cohort not found" />
  if (!cohortLearners) return <NotFound message="Cohort learners not found" />
  if (isLearner && !cohortLearners.some(learner => learner.id === user.id)) return <NotFound message="You do not have access to this page" />

  const handleGoToCourse = (course: Course) => {
    if (course.status === "Archived") {
      toast.error("This course is archived and no longer available")
      return
    }

    if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
      const firstChapter = course.sections[0].chapters[0]
      router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, { scroll: false })
    } else {
      router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}`, { scroll: false })
    }
  }

  const handleCourseEnroll = (course: Course) => {
    if (!user) {
      toast.error("You must be logged in to enroll in courses")
      return
    }

    const isEnrolled = course.enrollments?.some((enrollment) => enrollment.userId === user.id)

    if (!isEnrolled) {
      setEnrollingCourseId(course.courseId)
      handleEnroll(user.id, course.courseId, createTransaction)
        .then(() => {
          toast.success(`Successfully enrolled in ${course.title}`)
          if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
            router.push(
              `/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
            )
          }
          refetch()
          setEnrollingCourseId(null)
        })
        .catch((error) => {
          console.error("Enrollment error:", error)
          toast.error("Failed to enroll in course")
          setEnrollingCourseId(null)
        })
    } else {
      toast.info("You are already enrolled in this course")
    }
  }

  const archivedCount = courses.filter((course) => course.status === "Archived").length

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
          filteredCourses
            .filter((course) => course !== null)
            .map((course) => {
              if (!course) return null
              return (
                <div key={course.courseId} className="relative">
                  <CourseCard
                    course={course}
                    variant={isInstructor || course.instructors?.some((instructor) => instructor.userId === user?.id) ? "instructor" : "learner"}
                    isEnrolled={course.enrollments?.some((enrollment) => enrollment.userId === user.id)}
                    progress={progressesByCourseId[course.courseId]}
                    onView={handleGoToCourse}
                    onEnroll={handleCourseEnroll}
                    isEnrolling={enrollingCourseId === course.courseId}
                    onEdit={
                      (isInstructor || course.instructors?.some((instructor) => instructor.userId === user?.id))
                        ? () =>
                            router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/edit`)
                        : undefined
                    }
                    onStats={
                      isInstructor
                        ? () =>
                            router.push(`/organizations/${orgId}/cohorts/${cohortId}/courses/${course.courseId}/stats`)
                        : undefined
                    }
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

