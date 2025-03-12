"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useGetUserEnrolledCoursesQuery } from "@/state/api"
import Header from "@/components/Header"
import { Toolbar } from "@/components/Toolbar"
import CourseCard from "@/components/CourseCard"
import { Archive } from "lucide-react"
import toast from "react-hot-toast"
import { Spinner } from "@/components/ui/Spinner"
import { useOrganization } from "@/context/OrganizationContext"

const ArchivedOverlay = () => (
  <div className="absolute inset-0 bg-black/90 flex items-center justify-center flex-col gap-2 p-4 text-center rounded-lg">
    <Archive className="h-12 w-12" />
    <p className="text-lg font-semibold">Archived</p>
    <p className="text-sm text-gray-300">This course is no longer available for viewing</p>
  </div>
)

const UserCourses = () => {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const { currentOrg } = useOrganization()

  const {
    data: courses,
    isLoading,
    isError,
  } = useGetUserEnrolledCoursesQuery(user?.id ?? "", {
    skip: !isLoaded || !user,
  })

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

  if (isLoading) return <Spinner />
  if (isError || !courses)
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">Error loading courses.</div>
    )

  const archivedCount = courses?.filter((course) => course.status === "Archived").length

  return (
    <div className="space-y-6">
      <Header title="My Courses" subtitle="View your enrolled courses" />
      <Toolbar onSearch={setSearchTerm} />
      {archivedCount > 0 && (
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center mb-4 ml-4 text-muted-foreground hover:text-foreground focus:outline-none"
        >
          <Archive className="h-6 w-6" />
        </button>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {filteredCourses.map((course) => (
          <div key={course.courseId} className="relative">
            <CourseCard course={course} onView={handleGoToCourse} onEnroll={() => {}} isEnrolled />
            {course.status === "Archived" && <ArchivedOverlay />}
          </div>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
          <p className="text-lg font-medium">No courses found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

export default UserCourses

