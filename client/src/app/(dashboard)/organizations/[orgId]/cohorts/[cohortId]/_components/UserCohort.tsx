"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/Spinner"
import { BookOpen, Users } from "lucide-react"

// Sample API hook (replace with actual implementation)
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
        ],
      })
      setIsLoading(false)
    }, 1000)
  }, [cohortId])

  return { data: cohort, isLoading }
}

const UserCohortPage = () => {
  const { cohortId } = useParams()
  const { data: cohort, isLoading } = useGetCohortQuery(cohortId as string)

  if (isLoading) {
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
                  {cohort.courses.length > 0 ? (
                    cohort.courses.map((course: any) => (
                      <TableRow key={course.id} className="cursor-pointer hover:bg-accent/50">
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Enrolled</Badge>
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
                  {cohort.learners.length > 0 ? (
                    cohort.learners.map((learner: any) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-medium">{learner.name}</TableCell>
                        <TableCell>{learner.email}</TableCell>
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

