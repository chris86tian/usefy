"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookCheck, BookOpen, CalendarDays, Clock, ChevronRight } from "lucide-react"
import { useGetOrganizationCoursesQuery } from "@/state/api"
import CourseCard from "@/components/CourseCard"
import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

interface UserDashboardProps {
  recentActivities: any[]
  upcomingEvents: any[]
}

const UserDashboard = ({ recentActivities, upcomingEvents }: UserDashboardProps) => {
  const router = useRouter()
  const { orgId } = useParams()
  const { user } = useUser()
  const { data: courses } = useGetOrganizationCoursesQuery(orgId as string)
  const publishedCourses = courses?.filter((course) => course.status === "Published") || []

  const handleEnroll = (courseId: string) => {
    console.log(orgId)
    router.push(`/checkout?step=1&id=${courseId}&orgId=${orgId}&showSignUp=false`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* My Learning */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Learning</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View all courses <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Track your progress across all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inProgress">
            <TabsList className="mb-4">
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="inProgress">
              <div className="space-y-4">
                {/* Example course cards - replace with actual data */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Introduction to React</h3>
                          <span className="text-xs font-medium text-green-600">65% complete</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Learn the fundamentals of React</p>
                        <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add more course cards as needed */}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="text-center py-6 text-muted-foreground">
                <BookCheck className="h-12 w-12 mx-auto mb-2" />
                <p>You haven&apos;t completed any courses yet.</p>
                <p className="text-sm">Your completed courses will appear here.</p>
              </div>
            </TabsContent>

            <TabsContent value="saved">
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2" />
                <p>You don&apos;t have any saved courses.</p>
                <p className="text-sm">You can bookmark courses to save them for later.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events and deadlines for your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {event.date} • {event.time}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  RSVP
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Organization courses */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Organization Courses</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {["Web Development", "Enterprise IT", "React & Next.js", "JavaScript", "Backend Development"].map(
            (tag, index) => (
              <span
                key={index}
                className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ),
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publishedCourses?.map((course) => (
            <CourseCard 
              key={course.courseId} 
              course={course} 
              onEnroll={handleEnroll}
              isEnrolled={course.enrollments?.some((enrollment) => enrollment.userId === user?.id) || false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard

