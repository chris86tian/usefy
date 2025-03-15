"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Plus, Users } from "lucide-react"
import { getUserName, handleEnroll } from "@/lib/utils"
import {
  useAddCourseToCohortMutation,
  useRemoveCourseFromCohortMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useCreateTransactionMutation,
  useUnenrollUserMutation,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useCreateCourseMutation,
} from "@/state/api"
import { CourseCard } from "@/components/CourseCard"
import { Toolbar } from "@/components/Toolbar"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { User } from "@clerk/nextjs/server"
import ManageUsersDialog from "./ManageUsersDialog"
import Header from "@/components/Header"

interface CohortCoursesProps {
  cohort: Cohort
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  courses: Course[]
  refetch: () => void
  currentUserId?: string
}

const CohortCourses = ({ cohort, orgUsers, courses, refetch, currentUserId }: CohortCoursesProps) => {
  const router = useRouter()

  const [createCourse] = useCreateCourseMutation()
  const [addCourseToCohort, { isLoading: addCourseLoading }] = useAddCourseToCohortMutation()
  const [removeCourseFromCohort] = useRemoveCourseFromCohortMutation()
  const [addCourseInstructor, { isLoading: addInstructorLoading }] = useAddCourseInstructorMutation()
  const [removeCourseInstructor] = useRemoveCourseInstructorMutation()
  const [createTransaction] = useCreateTransactionMutation()
  const [unenrollUser] = useUnenrollUserMutation()
  const [archiveCourse] = useArchiveCourseMutation()
  const [unarchiveCourse] = useUnarchiveCourseMutation()

  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [activeDialog, setActiveDialog] = useState<"none" | "addCourse" | "manageInstructors" | "manageUsers">("none")
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [isManageUsersDialogOpen, setIsManageUsersDialogOpen] = useState(false)
  const [selectedCourseForUsers, setSelectedCourseForUsers] = useState<Course | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const availableCourses = courses.filter((course) => !courses?.some((c) => c.courseId === course.courseId)) || []

  const REMOVE_INSTRUCTOR_VALUE = "remove_instructor"

  const filteredCourses = useMemo(() => {
    if (!courses) return []

    return courses
      .filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
      })
      .sort((a, b) => {
        const isUserInstructorA = a.instructors?.some((instructor) => instructor.userId === currentUserId)
        const isUserInstructorB = b.instructors?.some((instructor) => instructor.userId === currentUserId)
        if (isUserInstructorA && !isUserInstructorB) return -1
        if (!isUserInstructorA && isUserInstructorB) return 1
        return 0
      })
  }, [courses, searchTerm, currentUserId])

  const handleCreateCourse = async () => {
    const result = await createCourse().unwrap();

    if (orgUsers.admins) {
      for (const admin of orgUsers.admins) {
        await handleEnroll(admin.id, result.courseId, createTransaction);
      }
    }

    await addCourseToCohort({
      organizationId: cohort.organizationId,
      cohortId: cohort.cohortId,
      courseId: result.courseId,
    }).unwrap();
    
    router.push(`/organizations/${cohort.organizationId}/cohorts/${cohort.cohortId}/courses/${result.courseId}/edit`, {
      scroll: false,
    });
  };


  const handleAddCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course")
      return
    }

    try {
      await addCourseToCohort({
        organizationId: cohort?.organizationId as string,
        cohortId: cohort?.cohortId as string,
        courseId: selectedCourseId,
      })

      if (selectedInstructorId) {
        await addCourseInstructor({
          courseId: selectedCourseId,
          userId: selectedInstructorId,
        })

        handleEnroll(selectedInstructorId, selectedCourseId, createTransaction)
      }

      toast.success("Course added to cohort successfully")
      setActiveDialog("none")
      setSelectedCourseId("")
      setSelectedInstructorId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add course to cohort")
      setActiveDialog("none")
      setSelectedCourseId("")
      setSelectedInstructorId("")
    }
  }

  const openManageInstructorsDialog = (course: Course) => {
    setCourseToEdit(course)
    setSelectedInstructorId(course.instructors && course.instructors.length > 0 ? course.instructors[0].userId : "")
    setActiveDialog("manageInstructors")
  }

  const openManageUsersDialog = (course: Course) => {
    setSelectedCourseForUsers(course)
    setIsManageUsersDialogOpen(true)
  }

  const getInstructorName = (instructorId: string) => {
    const instructor = orgUsers?.instructors?.find((i) => i.id === instructorId)
    return instructor ? getUserName(instructor) : instructorId
  }

  const handleManageInstructors = async () => {
    if (!courseToEdit) {
      toast.error("No course selected")
      return
    }

    const hasCurrentInstructor = courseToEdit.instructors && courseToEdit.instructors.length > 0
    const isRemovingInstructor = hasCurrentInstructor && selectedInstructorId === REMOVE_INSTRUCTOR_VALUE

    try {
      if (hasCurrentInstructor) {
        await removeCourseInstructor({
          courseId: courseToEdit.courseId,
          userId: courseToEdit?.instructors?.[0].userId as string,
        })

        await unenrollUser({
          courseId: courseToEdit.courseId,
          userId: courseToEdit?.instructors?.[0].userId as string,
        })
      }

      if (selectedInstructorId && selectedInstructorId !== REMOVE_INSTRUCTOR_VALUE) {
        await addCourseInstructor({
          courseId: courseToEdit.courseId,
          userId: selectedInstructorId,
        })

        handleEnroll(selectedInstructorId, courseToEdit.courseId, createTransaction)
      }

      if (!selectedInstructorId && !isRemovingInstructor) {
        toast.error("Please select an instructor")
        return
      }

      toast.success(isRemovingInstructor ? "Instructor removed successfully" : "Course instructor updated successfully")
      closeAllDialogs()
      refetch()
    } catch (error) {
      toast.error(isRemovingInstructor ? "Failed to remove instructor" : "Failed to update course instructor")
      closeAllDialogs()
    }
  }

  const closeAllDialogs = () => {
    setActiveDialog("none")
    setCourseToEdit(null)
    setSelectedInstructorId("")
  }

  const handleEdit = (course: Course) => {
    router.push(`/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${course.courseId}/edit`, {
      scroll: false,
    })
  }

  const handleStats = (course: Course) => {
    router.push(`/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${course.courseId}/stats`, {
      scroll: false,
    })
  }

  const handleDeleteConfirmation = (course: Course) => {
    setCourseToDelete(course)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      await removeCourseFromCohort({
        organizationId: cohort.organizationId,
        cohortId: cohort.cohortId,
        courseId: courseToDelete.courseId,
      }).unwrap()
      toast.success(`Course "${courseToDelete.title}" removed from cohort`)
      refetch()
    } catch (error) {
      toast.error("Failed to remove course from cohort")
    } finally {
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  const handleArchive = async (course: Course) => {
    try {
      await archiveCourse(course.courseId).unwrap()
      toast.success(`Course "${course.title}" archived`)
      refetch()
    } catch (error) {
      toast.error("Failed to archive course")
    }
  }

  const handleUnarchive = async (course: Course) => {
    try {
      await unarchiveCourse(course.courseId).unwrap()
      toast.success(`Course "${course.title}" unarchived`)
      refetch()
    } catch (error) {
      toast.error("Failed to unarchive course")
    }
  }

  const handleGoToCourse = (course: Course) => {
    if (course.sections?.[0]?.chapters?.[0]) {
      router.push(
        `/organizations/${cohort?.organizationId}/cohorts/${cohort.cohortId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
        { scroll: false },
      )
    } else {
      router.push(`/organizations/${cohort?.organizationId}/cohorts/${cohort.cohortId}/courses/${course.courseId}`, { scroll: false })
    }
  }

  const isAdmin = orgUsers?.admins?.some((admin) => admin.id === currentUserId)

  return (
    <>
      <Header
        rightElement={
          <div className="flex items-center space-x-4">
            <Button onClick={handleCreateCourse}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
            <Dialog
              open={activeDialog === "addCourse"}
              onOpenChange={(open) => {
                setActiveDialog(open ? "addCourse" : "none")
                if (!open) {
                  setSelectedCourseId("")
                  setSelectedInstructorId("")
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Course to Cohort</DialogTitle>
                  <DialogDescription>Select a course and assign an instructor.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.length > 0 ? (
                          availableCourses.map((course) => (
                            <SelectItem key={course.courseId} value={course.courseId}>
                              {course.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">No courses available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor (Optional)</Label>
                    <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                      <SelectTrigger id="instructor">
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgUsers?.instructors?.length > 0 ? (
                          orgUsers?.instructors?.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {getUserName(instructor)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">No instructors available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setActiveDialog("none")}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCourse} disabled={addCourseLoading || addInstructorLoading}>
                    {addCourseLoading || addInstructorLoading ? "Adding..." : "Add Course"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Toolbar onSearch={setSearchTerm} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.courseId}
              course={course}
              variant="admin"
              isEnrolled={true}
              onEdit={handleEdit}
              onDelete={handleDeleteConfirmation}
              isOwner={!!isAdmin}
              onView={handleGoToCourse}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onStats={handleStats}
              customActions={[
                {
                  label: "Manage Instructors",
                  icon: <Users className="h-4 w-4 mr-2" />,
                  onClick: () => openManageInstructorsDialog(course),
                },
                {
                  label: "Manage Enrollments",
                  icon: <Users className="h-4 w-4 mr-2" />,
                  onClick: () => openManageUsersDialog(course),
                },
              ]}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] text-gray-500">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or add courses to this cohort</p>
          </div>
        )}
      </div>

      {/* Manage Instructors Dialog */}
      <Dialog open={activeDialog === "manageInstructors"} onOpenChange={(open) => !open && closeAllDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Course Instructors</DialogTitle>
            <DialogDescription>
              {courseToEdit?.instructors && courseToEdit.instructors.length > 0
                ? `Current instructor: ${getInstructorName(courseToEdit.instructors[0].userId)}`
                : "No instructor currently assigned"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Select Instructor</Label>
              <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="Select instructor">
                    {selectedInstructorId === REMOVE_INSTRUCTOR_VALUE
                      ? "Remove instructor"
                      : selectedInstructorId
                        ? getInstructorName(selectedInstructorId)
                        : "Select instructor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courseToEdit?.instructors && courseToEdit.instructors.length > 0 && (
                    <SelectItem value={REMOVE_INSTRUCTOR_VALUE}>
                      <span className="text-destructive">Remove instructor</span>
                    </SelectItem>
                  )}
                  {orgUsers?.instructors?.length > 0 ? (
                    orgUsers?.instructors?.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        <span className="flex flex-col">
                          <span>{getUserName(instructor)}</span>
                          <span className="text-xs text-muted-foreground">
                            {instructor.emailAddresses[0].emailAddress}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground">No instructors available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleManageInstructors}
              variant={selectedInstructorId === REMOVE_INSTRUCTOR_VALUE ? "destructive" : "default"}
            >
              {selectedInstructorId === REMOVE_INSTRUCTOR_VALUE
                ? "Remove Instructor"
                : courseToEdit?.instructors && courseToEdit.instructors.length > 0
                  ? "Change Instructor"
                  : "Assign Instructor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Users Dialog */}
      <ManageUsersDialog
        isOpen={isManageUsersDialogOpen}
        onClose={() => {
          setIsManageUsersDialogOpen(false)
          setSelectedCourseForUsers(null)
        }}
        course={selectedCourseForUsers}
        cohortLearners={orgUsers.learners}
        onSuccess={() => {
          refetch()
          setSelectedCourseForUsers(null)
          setIsManageUsersDialogOpen(false)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the course
              {courseToDelete && ` "${courseToDelete.title}"`} from this cohort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CohortCourses

