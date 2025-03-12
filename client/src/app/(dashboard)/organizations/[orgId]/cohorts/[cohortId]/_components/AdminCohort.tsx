"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/Spinner"
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
import { Search, UserPlus, BookOpen, Users, UserCheck, MoreHorizontal, MailPlusIcon } from "lucide-react"
import { getUserName, handleEnroll } from "@/lib/utils"
import {
  useGetOrganizationCoursesQuery,
  useAddLearnerToCohortMutation,
  useRemoveLearnerFromCohortMutation,
  useAddCourseToCohortMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useCreateTransactionMutation,
  useUnenrollUserMutation,
  useGetCohortQuery,
  useGetCohortLearnersQuery,
  useInviteUserToOrganizationMutation,
  useInviteUserToCohortMutation,
} from "@/state/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@clerk/nextjs/server"
import { useParams } from "next/navigation"
import ManageUsersDialog from "./ManageUsersDialog"
import Header from "@/components/Header"

interface AdminCohortPageProps {
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  usersLoading: boolean
  courses: Course[]
}

const AdminCohortPage = ({ orgUsers, usersLoading, courses }: AdminCohortPageProps) => {
  const { orgId, cohortId } = useParams()
  const { data: cohort, isLoading: cohortLoading, refetch } = useGetCohortQuery(
    { organizationId: orgId as string, cohortId: cohortId as string },
    { skip: !orgId || !cohortId },
  )
  const { data: orgCourses, isLoading: coursesLoading } = useGetOrganizationCoursesQuery(
    cohort?.organizationId as string,
  )
  const { data: learners, isLoading: cohortLearnersLoading } = useGetCohortLearnersQuery(
    { organizationId: cohort?.organizationId as string, cohortId: cohort?.cohortId as string },
    { skip: !cohort },
  )

  const [addLearnerToCohort] = useAddLearnerToCohortMutation()
  const [removeLearnerFromCohort] = useRemoveLearnerFromCohortMutation()
  const [addCourseToCohort] = useAddCourseToCohortMutation()
  const [addCourseInstructor] = useAddCourseInstructorMutation()
  const [removeCourseInstructor] = useRemoveCourseInstructorMutation()
  const [createTransaction] = useCreateTransactionMutation()
  const [unenrollUser] = useUnenrollUserMutation()
  const [inviteUser] = useInviteUserToOrganizationMutation()
  const [inviteUserToCohort] = useInviteUserToCohortMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLearnerId, setSelectedLearnerId] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [activeDialog, setActiveDialog] = useState<
    'none' | 'addLearner' | 'addCourse' | 'manageInstructors' | 'manageUsers' | 'inviteLearner'
  >('none')
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [isManageUsersDialogOpen, setIsManageUsersDialogOpen] = useState(false)
  const [selectedCourseForUsers, setSelectedCourseForUsers] = useState<Course | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [emailBatch, setEmailBatch] = useState<string[]>([])
  const [inviteRole, setInviteRole] = useState<string>("learner")

  const availableCourses = orgCourses?.filter((course) => !courses?.some((c) => c.courseId === course.courseId)) || []

  const REMOVE_INSTRUCTOR_VALUE = "remove_instructor"

  const handleAddLearner = async () => {
    if (!selectedLearnerId) {
      toast.error("Please select a learner")
      return
    }

    try {
      await addLearnerToCohort({
        organizationId: cohort?.organizationId as string,
        cohortId: cohort?.cohortId as string,
        learnerId: selectedLearnerId,
      })

      toast.success("Learner added to cohort successfully")
      setActiveDialog('none')
      setSelectedLearnerId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add learner to cohort")
      setActiveDialog('none')
      setSelectedLearnerId("")
    }
  }

  const handleAddByInvite = async () => {
    if (emailBatch.length === 0) {
      toast.error("Please enter at least one email address")
      return
    }

    try {
      for (const email of emailBatch) {
        await inviteUserToCohort({
          organizationId: cohort?.organizationId as string,
          cohortId: cohort?.cohortId as string,
          email: email.trim(),
          role: inviteRole,
        }).unwrap()
      }

      toast.success(`Invitations sent to ${emailBatch.join(", ")}`)
      setEmailBatch([])
      setInviteEmail("")
      setActiveDialog('none')
      refetch()
    } catch (error) {
      toast.error("Failed to send invitations")
    }
  }

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInviteEmail(value);

    // Split the input by commas and trim whitespace
    const emails = value.split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)); // Validate email format

    // Update the emailBatch state with unique emails
    setEmailBatch(emails);
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

      await addCourseInstructor({
        courseId: selectedCourseId,
        userId: selectedInstructorId,
      })

      handleEnroll(selectedInstructorId, selectedCourseId, createTransaction)

      toast.success("Course added to cohort with instructor successfully")
      setActiveDialog('none')
      setSelectedCourseId("")
      setSelectedInstructorId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add course to cohort")
      setActiveDialog('none')
      setSelectedCourseId("")
      setSelectedInstructorId("")
    }
  }

  const openManageInstructorsDialog = (course: Course) => {
    setCourseToEdit(course)
    setSelectedInstructorId(course.instructors && course.instructors.length > 0 
      ? course.instructors[0].userId 
      : "")
    setActiveDialog('manageInstructors')
  }

  const openManageUsersDialog = (course: Course) => {
    setSelectedCourseForUsers(course)
    setIsManageUsersDialogOpen(true)
  }

  const filteredLearners =
    orgUsers?.learners?.filter(
      (learner) =>
        !learners?.some((l) => l.id === learner.id) &&
        (getUserName(learner)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.emailAddresses[0].emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || []

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

      toast.success(
        isRemovingInstructor 
          ? "Instructor removed successfully" 
          : "Course instructor updated successfully"
      )
      closeAllDialogs()
      refetch()
    } catch (error) {
      toast.error(
        isRemovingInstructor 
          ? "Failed to remove instructor" 
          : "Failed to update course instructor"
      )
      closeAllDialogs()
    }
  }

  const closeAllDialogs = () => {
    setActiveDialog('none')
    setCourseToEdit(null)
    setSelectedInstructorId("")
  }

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address")
      return
    }

    try {
      await inviteUser({
        organizationId: cohort?.organizationId as string,
        email: inviteEmail.trim(),
        role: inviteRole,
      }).unwrap()

      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

  const handleRemoveLearner = async (learnerId: string) => {
    try {
      await removeLearnerFromCohort({
        organizationId: cohort?.organizationId as string,
        cohortId: cohort?.cohortId as string,
        learnerId,
      }).unwrap();

      toast.success("Learner removed from cohort successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to remove learner from cohort");
    }
  };

  if (cohortLoading || usersLoading || coursesLoading || cohortLearnersLoading) {
    return <Spinner />
  }

  if (!cohort) {
    return <div>Cohort not found</div>
  }

  return (
    <div className="space-y-6">
      <Header title={cohort.name} subtitle="Manage cohort learners and courses" />

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cohort Members</h2>
            <div className="flex gap-2">
              <Dialog
                open={activeDialog === 'addLearner'}
                onOpenChange={(open) => {
                  setActiveDialog(open ? 'addLearner' : 'none');
                  if (!open) setSelectedLearnerId("");
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Learner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Learner to Cohort</DialogTitle>
                    <DialogDescription>Select a learner to add to this cohort.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search learners..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto border rounded-md">
                      {filteredLearners?.length > 0 ? (
                        filteredLearners?.map((learner) => (
                          <div
                            key={learner.id}
                            className={`flex items-center justify-between p-3 hover:bg-accent cursor-pointer ${
                              selectedLearnerId === learner.id ? "bg-accent" : ""
                            }`}
                            onClick={() => setSelectedLearnerId(learner.id)}
                          >
                            <div>
                              <p className="font-medium">{getUserName(learner)}</p>
                              <p className="text-sm text-muted-foreground">{learner.emailAddresses[0].emailAddress}</p>
                            </div>
                            {selectedLearnerId === learner.id && <UserCheck className="h-5 w-5 text-primary" />}
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-center text-muted-foreground">No learners found</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActiveDialog('none')}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddLearner}>Add to Cohort</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={activeDialog === 'inviteLearner'} onOpenChange={(open) => {
                setActiveDialog(open ? 'inviteLearner' : 'none');
                if (!open) {
                  setEmailBatch([]);
                  setInviteEmail("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <MailPlusIcon className="mr-2 h-4 w-4" />
                    Invite Learner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Learners</DialogTitle>
                    <DialogDescription>Enter the email addresses of the learners you want to invite, separated by commas.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      type="text"
                      placeholder="Enter email addresses (comma separated)"
                      value={inviteEmail}
                      onChange={handleEmailInput}
                    />
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActiveDialog('none')}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddByInvite}>Send Invitations</Button>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners && learners.length > 0 ? (
                    learners.map((learner) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-medium">{getUserName(learner)}</TableCell>
                        <TableCell>{learner.emailAddresses[0].emailAddress}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleRemoveLearner(learner.id)} variant="outline" size="sm">
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No learners in this cohort
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cohort Courses</h2>
            <Dialog
              open={activeDialog === 'addCourse'}
              onOpenChange={(open) => {
                setActiveDialog(open ? 'addCourse' : 'none')
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
                    <Label htmlFor="instructor">Instructor</Label>
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
                  <Button variant="outline" onClick={() => setActiveDialog('none')}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCourse}>Add to Cohort</Button>
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
                  {courses.length > 0 ? (
                    courses.map((course) => (
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
        </TabsContent>
      </Tabs>

      {/* Manage Instructors Dialog */}
      <Dialog 
        open={activeDialog === 'manageInstructors'} 
        onOpenChange={(open) => !open && closeAllDialogs()}
      >
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
              <Select 
                value={selectedInstructorId} 
                onValueChange={setSelectedInstructorId}
              >
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
                : (courseToEdit?.instructors && courseToEdit.instructors.length > 0) 
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
        cohortLearners={learners as User[]}
        onSuccess={() => {
          refetch()
          setSelectedCourseForUsers(null)
          setIsManageUsersDialogOpen(false)
        }}
      />
    </div>
  )
}

export default AdminCohortPage

