"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen } from "lucide-react"
import { getUserName } from "@/lib/utils"
import { useAddCourseToCohortMutation, useAddCourseInstructorMutation, useCreateCourseMutation } from "@/state/api"

interface CoursesTabProps {
  cohort: any
  orgCourses: any
  orgUsers: any
  orgId: string
  cohortId: string
  refetchCohort: () => void
}

const CoursesTab = ({ cohort, orgCourses, orgUsers, orgId, cohortId, refetchCohort }: CoursesTabProps) => {
  const [addCourseToCohort] = useAddCourseToCohortMutation()
  const [addCourseInstructor] = useAddCourseInstructorMutation()

  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)

  const handleAddCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course")
      return
    }

    if (!selectedInstructorId) {
      toast.error("Please select an instructor")
      return
    }

    try {
      // First add the course to the cohort
      await addCourseToCohort({
        organizationId: orgId,
        cohortId: cohortId,
        courseId: selectedCourseId,
      })

      // Then assign the instructor to the course
      await addCourseInstructor({
        courseId: selectedCourseId,
        userId: selectedInstructorId,
      })

      toast.success("Course added to cohort with instructor successfully")
      setIsAddCourseDialogOpen(false)
      setSelectedCourseId("")
      setSelectedInstructorId("")
      refetchCohort()
    } catch (error) {
      toast.error("Failed to add course to cohort")
    }
  }

  const availableCourses = orgCourses?.filter(
    (course: any) => !cohort?.courses.some((c: any) => c.courseId === course.courseId),
  )

  const getInstructorName = (instructorId: string) => {
    const instructor = orgUsers?.instructors?.find((i: any) => i.id === instructorId)
    return instructor ? getUserName(instructor) : instructorId
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cohort Courses</h2>
        <div className="flex gap-2">
          <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
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
                      {availableCourses && availableCourses.length > 0 ? (
                        availableCourses?.map((course: any) => (
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
                  <Label htmlFor="instructor">Instructor</Label>
                  <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                    <SelectTrigger id="instructor">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgUsers?.instructors?.map((instructor: any) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {getUserName(instructor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCourseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCourse}>Add to Cohort</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohort.courses && cohort.courses.length > 0 ? (
                cohort.courses.map((course: any) => (
                  <TableRow key={course.courseId}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      {course.instructors && course.instructors.length > 0
                        ? getInstructorName(course.instructors[0].userId)
                        : "No instructor assigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No courses in this cohort
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export default CoursesTab

