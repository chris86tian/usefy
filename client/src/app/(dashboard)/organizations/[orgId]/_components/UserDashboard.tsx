import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCheck, BookOpen, CalendarDays, Clock, ChevronRight } from "lucide-react";
import { useGetOrganizationCoursesQuery } from "@/state/api";
import CourseCardSearch from "@/components/CourseCardSearch";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getUserName } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";

interface UserDashboardProps {
  recentActivities: any[]
  upcomingEvents: any[]
}

const UserDashboard = ({ recentActivities, upcomingEvents }: UserDashboardProps) => {
    const router = useRouter()
    const { orgId } = useParams()
    const { data: courses } = useGetOrganizationCoursesQuery(orgId as string)
    const { user } = useUser()
    const name = getUserName(user as unknown as User)
    const publishedCourses = courses?.filter(course => course.status === "Published") || []

    const handleCourseClick = (courseId: string) => {
      router.push(`/search?id=${courseId}`, {
        scroll: false,
      })
    }

    return (
      <div className="space-y-6">
        {/* Welcome */}
        <Card className="bg-gray-900">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold">Welcome, {name}!</h2>
            <p className="mt-2 max-w-md opacity-90">Continue your learning journey or discover new courses to expand your skills.</p>
          </CardContent>
        </Card>
        
        {/* My Learning */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Learning</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
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
                        <div className="h-14 w-14 rounded-md bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                          <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Introduction to React</h3>
                            <span className="text-xs font-medium text-green-600">65% complete</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Learn the fundamentals of React</p>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: "65%" }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-md bg-purple-100 flex items-center justify-center dark:bg-purple-900">
                          <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Advanced TypeScript</h3>
                            <span className="text-xs font-medium text-green-600">30% complete</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Master TypeScript&apos;s advanced features</p>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: "30%" }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="text-center py-6 text-gray-500">
                  <BookCheck className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>You haven&apos;t completed any courses yet.</p>
                  <p className="text-sm">Your completed courses will appear here.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="saved">
                <div className="text-center py-6 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
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
                  <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900">
                    <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">RSVP</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Organization courses */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Organization Courses</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Web Development", "Enterprise IT", "React & Next.js", "JavaScript", "Backend Development"].map(
            (tag, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
              >
                {tag}
              </span>
            )
          )}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {courses?.map((course, index) => (
              <CourseCardSearch key={index} course={course} onClick={() => handleCourseClick(course.courseId)} />
            ))}
        </div>
      </div>
    )
  }

export default UserDashboard;  