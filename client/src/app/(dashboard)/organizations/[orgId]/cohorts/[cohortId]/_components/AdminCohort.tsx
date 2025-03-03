"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { PlusCircle, Search, UserPlus, BookOpen, Users, UserCheck } from 'lucide-react'
import { v4 as uuidv4 } from "uuid"

// Sample API hooks (replace with actual implementations)
const useGetCohortQuery = (cohortId: string) => {
  // Simulate API call
  const [isLoading, setIsLoading] = useState(true)
  const [cohort, setCohort] = useState<any>(null)

  useEffect(() => {
    setTimeout(() => {
      setCohort({
        cohortId,
        name: "Cohort 2023",
        learners: [
          { id: "1", name: "John Doe", email: "john@example.com" },
          { id: "2", name: "Jane Smith", email: "jane@example.com" },
        ],
        courses: [
          { id: "1", title: "Introduction to React", instructor: "Alice Johnson" },
          { id: "2", title: "Advanced JavaScript", instructor: "Bob Williams" },
        ]
      })
      setIsLoading(false)
    }, 1000)
  }, [cohortId])

  return { data: cohort, isLoading }
}

const useGetOrganizationUsersQuery = (orgId: string) => {
  // Simulate API call
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<any>(null)

  useEffect(() => {
    setTimeout(() => {
      setUsers({
        learners: [
          { id: "3", name: "Michael Brown", email: "michael@example.com" },
          { id: "4", name: "Sarah Davis", email: "sarah@example.com" },
          { id: "5", name: "David Wilson", email: "david@example.com" },
        ],
        instructors: [
          { id: "6", name: "Alice Johnson", email: "alice@example.com" },
          { id: "7", name: "Bob Williams", email: "bob@example.com" },
        ]
      })
      setIsLoading(false)
    }, 1000)
  }, []) // Removed unnecessary dependency: orgId

  return { data: users, isLoading }
}

const useGetOrganizationCoursesQuery = (orgId: string) => {
  // Simulate API call
  const [isLoading, setIsLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])

  useEffect(() => {
    setTimeout(() => {
      setCourses([
        { id: "1", title: "Introduction to React", instructor: "Alice Johnson", cohorts: ["1"] },
        { id: "2", title: "Advanced JavaScript", instructor: "Bob Williams", cohorts: ["1"] },
        { id: "3", title: "Node.js Fundamentals", instructor: "Alice Johnson", cohorts: [] },
        { id: "4", title: "CSS Mastery", instructor: "Bob Williams", cohorts: [] },
      ])
      setIsLoading(false)
    }, 1000)
  }, [orgId])

  return { data: courses, isLoading }
}

// Sample mutation hooks
const useAddLearnerToCohortMutation = () => {
  const addLearner = async (data: { cohortId: string, learnerId: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  }
  return [addLearner, { isLoading: false }]
}

const useCreateCourseMutation = () => {
  const createCourse = async (data: { orgId: string, title: string, instructorId: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true, courseId: uuidv4() }
  }
  return [createCourse, { isLoading: false }]
}

const useAddCourseToCohortMutation = () => {
  const addCourse = async (data: { cohortId: string, courseId: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  }
  return [addCourse, { isLoading: false }]
}

const AdminCohortPage = () => {
  const { orgId, cohortId } = useParams()
  const { user } = useUser()
  const { data: cohort, isLoading: cohortLoading } = useGetCohortQuery(cohortId as string)
  const { data: orgUsers, isLoading: usersLoading } = useGetOrganizationUsersQuery(orgId as string)
  const { data: orgCourses, isLoading: coursesLoading } = useGetOrganizationCoursesQuery(orgId as string)
  
  const [addLearnerToCohort] = useAddLearnerToCohortMutation()
  const [createCourse] = useCreateCourseMutation()
  const [addCourseToCohort] = useAddCourseToCohortMutation()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLearnerId, setSelectedLearnerId] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [isAddLearnerDialogOpen, setIsAddLearnerDialogOpen] = useState(false)
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false)
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)

  const handleAddLearner = async () => {
    if (!selectedLearnerId) {
      toast.error("Please select a learner")
      return
    }

    try {
    //   await addLearnerToCohort({
    //     cohortId: cohortId as string,
    //     learnerId: selectedLearnerId
    //   })
      toast.success("Learner added to cohort successfully")
      setIsAddLearnerDialogOpen(false)
      setSelectedLearnerId("")
      // Refetch cohort data
    } catch (error) {
      toast.error("Failed to add learner to cohort")
    }
  }

  const handleCreateCourse = async () => {
    if (!newCourseTitle) {
      toast.error("Please enter a course title")
      return
    }

    if (!selectedInstructorId) {
      toast.error("Please select an instructor")
      return
    }

    try {
    //   await createCourse({
    //     orgId: orgId as string,
    //     title: newCourseTitle,
    //     instructorId: selectedInstructorId
    //   })
      toast.success("Course created successfully")
      setIsCreateCourseDialogOpen(false)
      setNewCourseTitle("")
      setSelectedInstructorId("")
      // Refetch courses data
    } catch (error) {
      toast.error("Failed to create course")
    }
  }

  const handleAddCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course")
      return
    }

    try {
    //   await addCourseToCohort({
    //     cohortId: cohortId as string,
    //     courseId: selectedCourseId
    //   })
      toast.success("Course added to cohort successfully")
      setIsAddCourseDialogOpen(false)
      setSelectedCourseId("")
      // Refetch cohort data
    } catch (error) {
      toast.error("Failed to add course to cohort")
    }
  }

  const filteredLearners = orgUsers?.learners?.filter((learner: any) => 
    !cohort?.learners.some((l: any) => l.id === learner.id) &&
    (learner.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     learner.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const availableCourses = orgCourses?.filter(course => 
    !cohort?.courses.some((c: any) => c.id === course.id)
  )

  if (cohortLoading || usersLoading || coursesLoading) {
    return <Spinner />
  }

  if (!cohort) {
    return <div>Cohort not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{cohort.name}</h1>
      </div>

      <Tabs defaultValue="learners" className="w-full">
        <TabsList>
          <TabsTrigger value="learners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learners
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cohort Learners</h2>
            <Dialog open={isAddLearnerDialogOpen} onOpenChange={setIsAddLearnerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Learner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Learner to Cohort</DialogTitle>
                  <DialogDescription>
                    Select a learner to add to this cohort.
                  </DialogDescription>
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
                      filteredLearners.map((learner: any) => (
                        <div
                          key={learner.id}
                          className={`flex items-center justify-between p-3 hover:bg-accent cursor-pointer ${
                            selectedLearnerId === learner.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedLearnerId(learner.id)}
                        >
                          <div>
                            <p className="font-medium">{learner.name}</p>
                            <p className="text-sm text-muted-foreground">{learner.email}</p>
                          </div>
                          {selectedLearnerId === learner.id && (
                            <UserCheck className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="p-3 text-center text-muted-foreground">No learners found</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddLearnerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLearner}>Add to Cohort</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohort.learners.length > 0 ? (
                    cohort.learners.map((learner: any) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-medium">{learner.name}</TableCell>
                        <TableCell>{learner.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Active</Badge>
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
            <div className="flex gap-2">
              <Dialog open={isCreateCourseDialogOpen} onOpenChange={setIsCreateCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Create a new course and assign an instructor.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <Input
                        id="courseTitle"
                        placeholder="Enter course title"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                      />
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
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateCourseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCourse}>Create Course</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                    <DialogDescription>
                      Select a course to add to this cohort.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger id="course">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourses?.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
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
                  {cohort.courses.length > 0 ? (
                    cohort.courses.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminCohortPage
