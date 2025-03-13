"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { BookOpen, Users, MoreHorizontal } from "lucide-react"
import { getUserName, handleEnroll } from "@/lib/utils"
import {
  useGetOrganizationCoursesQuery,
  useAddCourseToCohortMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useCreateTransactionMutation,
  useUnenrollUserMutation,
  useGetCohortLearnersQuery,
} from "@/state/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@clerk/nextjs/server"
import ManageUsersDialog from "./ManageUsersDialog"


interface CohortCoursesTabProps {
  cohort: Cohort
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  courses: Course[]
  refetch: () => void
}

const CohortCoursesTab = ({ cohort, orgUsers, courses, refetch }: CohortCoursesTabProps) => {
  const { data: orgCourses, isLoading: coursesLoading } = useGetOrganizationCoursesQuery(
    cohort?.organizationId as string,
  )
  const { data: cohortLearners } = useGetCohortLearnersQuery(
    { organizationId: cohort?.organizationId as string, cohortId: cohort?.cohortId as string },
    { skip: !cohort },
  )

  const [addCourseToCohort, { isLoading: addCourseLoading }] = useAddCourseToCohortMutation()
  const [addCourseInstructor, { isLoading: addInstructorLoading }] = useAddCourseInstructorMutation()
  const [removeCourseInstructor] = useRemoveCourseInstructorMutation()
  const [createTransaction] = useCreateTransactionMutation()
  const [unenrollUser] = useUnenrollUserMutation()

  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [activeDialog, setActiveDialog] = useState<"none" | "addCourse" | "manageInstructors" | "manageUsers">("none")
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [isManageUsersDialogOpen, setIsManageUsersDialogOpen] = useState(false)
  const [selectedCourseForUsers, setSelectedCourseForUsers] = useState<Course | null>(null)

  const availableCourses = orgCourses?.filter((course) => !courses?.some((c) => c.courseId === course.courseId)) || []

  const REMOVE_INSTRUCTOR_VALUE = "remove_instructor"

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
    const instructor = orgUsers?.instructors?.find((i: User) => i.id === instructorId)
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

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cohort Courses</h2>
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
                    {orgUsers?.instructors?.map((instructor: User) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {getUserName(instructor)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveDialog("none")}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCourse}
                disabled={addCourseLoading || addInstructorLoading}
              >
                {addCourseLoading || addInstructorLoading ? "Adding..." : "Add Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.length > 0 ? (
                courses.map((course) => (
                  <TableRow key={course.courseId}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      {course.instructors && course.instructors.length > 0
                        ? getInstructorName(course.instructors[0].userId)
                        : "No instructor assigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openManageInstructorsDialog(course)}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Instructors
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openManageUsersDialog(course)}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Enrollments
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No courses in this cohort
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                  {orgUsers?.instructors?.map((instructor: User) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      <span className="flex flex-col">
                        <span>{getUserName(instructor)}</span>
                        <span className="text-xs text-muted-foreground">
                          {instructor.emailAddresses[0].emailAddress}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
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
        cohortLearners={cohortLearners as User[]}
        onSuccess={() => {
          refetch()
          setSelectedCourseForUsers(null)
          setIsManageUsersDialogOpen(false)
        }}
      />
    </>
  )
}

export default CohortCoursesTab

