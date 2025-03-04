"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/Spinner"
import { BookOpen, Users } from "lucide-react"
import { getUserName, handleEnroll } from "@/lib/utils"
import type { User } from "@clerk/nextjs/server"
import { useUser } from "@clerk/nextjs"
import { useCreateTransactionMutation } from "@/state/api"
import { toast } from "sonner"
import { 
  useGetCohortLearnersQuery,
  useGetCohortQuery,
} from "@/state/api"
import { useParams } from "next/navigation"

interface UserCohortPageProps {
  orgUsers: { instructors: User[], learners: User[], admins: User[] }
  usersLoading: boolean
  courses: Course[]
}

const UserCohortPage = ({ orgUsers, usersLoading, courses }: UserCohortPageProps) => {
  const { user } = useUser()
  const { orgId, cohortId } = useParams()
  
  const { data: cohort, isLoading: cohortLoading, refetch } = useGetCohortQuery({ organizationId: orgId as string, cohortId: cohortId as string }, { skip: !orgId || !cohortId })
  const { data: learners, isLoading: cohortLearnersLoading } = useGetCohortLearnersQuery({ organizationId: cohort?.organizationId as string, cohortId: cohort?.cohortId as string }, { skip: !cohort })

  const [createTransaction] = useCreateTransactionMutation()

  const getInstructorName = (instructorId: string) => {
    const instructor = orgUsers?.instructors?.find((i: User) => i.id === instructorId)
    return instructor ? getUserName(instructor) : instructorId
  }

  const handleCourseClick = (course: Course) => {
    if (!user) {
      toast.error("You must be logged in to enroll in courses")
      return
    }

    const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === user.id)

    if (!isEnrolled) {
      handleEnroll(user.id, course.courseId, createTransaction)
        .then(() => {
          toast.success(`Successfully enrolled in ${course.title}`)
          setTimeout(() => {
            refetch()
          }, 100)
        })
        .catch((error) => {
          console.error("Enrollment error:", error)
          toast.error("Failed to enroll in course")
        })
    } else {
      toast.info("You are already enrolled in this course")
    }
  }

  if (cohortLoading || usersLoading) {
    return <Spinner />
  }

  if (!cohort) {
    return <div>Cohort not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{cohort.name}</h1>
        <p className="text-muted-foreground">View your cohort details and courses</p>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Courses</CardTitle>
            </CardHeader>
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
                  {courses.length > 0 ? (
                    courses.map((course: Course) => {
                      const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === user?.id)
                      return (
                        <TableRow
                          key={course.courseId}
                          className="cursor-pointer hover:bg-accent/50"
                        >
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{getInstructorName(course?.instructors?.[0]?.userId || "")}</TableCell>
                          <TableCell>
                            <Badge variant={isEnrolled ? "outline" : "default"} onClick={() => handleCourseClick(course)}>
                              {isEnrolled ? "Enrolled" : "Enroll"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
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

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners && learners.length > 0 ? (
                    learners.map((learner: User) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-medium">{getUserName(learner)}</TableCell>
                        <TableCell>{learner.emailAddresses[0].emailAddress}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No members in this cohort
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

export default UserCohortPage

