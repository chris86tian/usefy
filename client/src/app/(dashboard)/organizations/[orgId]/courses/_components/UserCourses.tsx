"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { Toolbar } from "@/components/Toolbar"
import CourseCard from "@/components/CourseCard"
import { Archive } from "lucide-react"
import { toast } from "sonner"
import { useOrganization } from "@/context/OrganizationContext"
import { useUser } from "@clerk/nextjs"
import { handleEnroll } from "@/lib/utils"
import { useCreateTransactionMutation, useGetMyUserCourseProgressesQuery } from "@/state/api"

interface UserCoursesProps {
  courses: Course[]
  refetch: () => void
}

const ArchivedOverlay = () => (
  <div className="absolute inset-0 bg-black/90 flex items-center justify-center flex-col gap-2 p-4 text-center rounded-lg">
    <Archive className="h-12 w-12" />
    <p className="text-lg font-semibold">Archived</p>
    <p className="text-sm text-gray-300">This course is no longer available for viewing</p>
  </div>
)

const UserCourses = ({ courses, refetch }: UserCoursesProps) => {
  const { user } = useUser()
  const { currentOrg } = useOrganization()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const { data: progresses } = useGetMyUserCourseProgressesQuery(currentOrg?.organizationId as string)

  const [createTransaction] = useCreateTransactionMutation()

  // Create a map of course progresses by courseId for easy lookup
  const progressesByCourseId = useMemo(() => {
    if (!progresses) return {}

    return progresses.reduce(
      (acc, progress) => {
        acc[progress.courseId] = progress
        return acc
      },
      {} as Record<string, (typeof progresses)[0]>,
    )
  }, [progresses])

  const filteredCourses = useMemo(() => {
    if (!courses) return []

    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArchiveStatus = showArchived ? true : course.status !== "Archived"
      return matchesSearch && matchesArchiveStatus
    })
  }, [courses, searchTerm, showArchived])

  const handleGoToCourse = (course: Course) => {
    if (course.status === "Archived") {
      toast.error("This course is archived and no longer available")
      return
    }

    if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
      const firstChapter = course.sections[0].chapters[0]
      router.push(
        `/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/chapters/${firstChapter.chapterId}`,
        {
          scroll: false,
        },
      )
    } else {
      router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}`, {
        scroll: false,
      })
    }
  }

  const handleCourseEnroll = (course: Course) => {
    if (!user) {
      toast.error("You must be logged in to enroll in courses")
      return
    }

    const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === user.id)

    if (!isEnrolled) {
      handleEnroll(user.id, course.courseId, createTransaction)
        .then(() => {
          toast.success(`Successfully enrolled in ${course.title}`)
          if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
            router.push(
              `/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
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

  if (!courses)
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">Error loading courses.</div>
    )

  const archivedCount = courses?.filter((course) => course.status === "Archived").length

  return (
    <div className="space-y-6">
      <Header title="My Courses" subtitle="View your enrolled courses" />

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === user?.id)
            const courseProgress = progressesByCourseId[course.courseId]

            return (
              <div key={course.courseId} className="relative">
                <CourseCard
                  course={course}
                  onView={handleGoToCourse}
                  onEnroll={handleCourseEnroll}
                  isEnrolled={isEnrolled}
                  progress={courseProgress}
                />
                {course.status === "Archived" && <ArchivedOverlay />}
              </div>
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserCourses

