"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetCohortLearnersQuery, useGetCourseStatsQuery } from "@/state/api"
import { User } from "@clerk/nextjs/server"
import { Clock, Users, Book, Calendar, UserCheck } from "lucide-react"
import { useState, useMemo } from "react"
import { getUserName } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format, subDays } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRange, SelectRangeEventHandler } from "react-day-picker"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import UserStatsModal from "../../courses/[courseId]/stats/_components/UserStatsModal"
import { Skeleton } from "@/components/ui/skeleton"

interface TimeTrackingRecord {
  userId: string
  duration: number
  isLogin: boolean
}

interface DailyDataRecord {
  date: string
  duration: number
  activeUsers: number
}

interface CourseStats {
  title: string
  totalDuration: number
  totalUsers: number
  dailyData: DailyDataRecord[]
}

interface UserStatsModalProps {
  user: User
  courseId: string
  isOpen: boolean
  onClose: () => void
}

interface CohortStatsProps {
  cohort: Cohort
}

interface CourseQueryResult {
  courseId: string
  data: any
  isLoading: boolean
}

function useCourseQueries(courses: Array<{ courseId: string }>) {
  // Create individual queries for each course
  const queries = courses.map(course => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, isLoading } = useGetCourseStatsQuery(course.courseId)
    return { courseId: course.courseId, data, isLoading }
  })

  return queries
}

export default function CohortStats({ cohort }: CohortStatsProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  })

  const { data: learners, isLoading: isLoadingLearners } = useGetCohortLearnersQuery({
    organizationId: cohort.organizationId,
    cohortId: cohort.cohortId
  })

  // Get stats for all courses using custom hook
  const courseQueries = useCourseQueries(cohort.courses)

  const totalLogins = useMemo(() => {
    return courseQueries.reduce((sum, { data }) => {
      return sum + (data?.totalLogins || 0)
    }, 0)
  }, [courseQueries])

  const totalTimeSpent = useMemo(() => {
    return courseQueries.reduce((sum, { data }) => {
      return sum + (data?.totalTimeSpent || 0)
    }, 0)
  }, [courseQueries])

  const uniqueActiveUsers = useMemo(() => {
    const userIds = new Set<string>()
    courseQueries.forEach(({ data }) => {
      data?.timeTracking?.forEach((record: TimeTrackingRecord) => {
        userIds.add(record.userId)
      })
    })
    return userIds.size
  }, [courseQueries])

  // Calculate filtered data for charts
  const filteredData = useMemo(() => {
    const data: any[] = []
    courseQueries.forEach(({ data: courseData }) => {
      if (courseData?.dailyData) {
        courseData.dailyData.forEach((day: any) => {
          const existingDay = data.find(d => d.date === day.date)
          if (existingDay) {
            existingDay.duration += day.duration
            existingDay.activeUsers = Math.max(existingDay.activeUsers, day.activeUsers)
            existingDay.logins += day.logins || 0
          } else {
            data.push({
              date: day.date,
              duration: day.duration,
              activeUsers: day.activeUsers,
              logins: day.logins || 0
            })
          }
        })
      }
    })
    return data.sort((a, b) => a.date.localeCompare(b.date))
  }, [courseQueries])

  if (isLoadingLearners) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learners?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(totalTimeSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time/User</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(learners?.length ? totalTimeSpent / learners.length : 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatTime(value), "Time Spent"]}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="duration" stroke="#2563eb" name="Time Spent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users & Logins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === "Active Users") {
                      return [value, name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="activeUsers" fill="#2563eb" name="Active Users" />
                <Bar dataKey="logins" fill="#22c55e" name="Logins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {learners?.map((learner) => (
                <div
                  key={learner.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedUser(learner)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {learner.firstName?.[0] || "U"}
                    </div>
                    <div>
                      <div className="font-medium">{getUserName(learner)}</div>
                      <div className="text-sm text-muted-foreground">
                        {courseQueries.map(({ courseId, data }) => {
                          const course = cohort.courses.find(c => c.courseId === courseId)
                          const timeSpent = data?.timeTracking
                            ?.filter((record: TimeTrackingRecord) => record.userId === learner.id)
                            ?.reduce((sum: number, record: TimeTrackingRecord) => sum + record.duration, 0) || 0
                          return (
                            <div key={courseId} className="flex items-center gap-2">
                              <Badge variant="outline">{course?.courseId}</Badge>
                              <span className="text-xs">{formatTime(timeSpent)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {courseQueries.filter(({ data }) => 
                        data?.timeTracking?.some((record: TimeTrackingRecord) => 
                          record.userId === learner.id
                        )
                      ).length} courses
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserStatsModal
          user={selectedUser}
          courseId={cohort.courses[0]?.courseId || ""}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

interface UserCourseStatsProps {
  userId: string
  courseId: string
}

function UserCourseStats({ userId, courseId }: UserCourseStatsProps) {
  const { data: course, isLoading: isCourseLoading } = useGetCourseStatsQuery(courseId)

  const totalTimeSpent = course?.dailyData.reduce((sum: number, record: DailyDataRecord) => {
    const durationMs = Number(record.duration) || 0
    return sum + durationMs
  }, 0) || 0

  const formatTime = (ms: number) => {
    if (!ms) return "0h 0m"
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (isCourseLoading) return <Skeleton className="h-16 w-full" />

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded">
      <div>
        <h4 className="font-medium">{course?.title || "Loading..."}</h4>
        <p className="text-sm text-muted-foreground">
          {`Time spent: ${formatTime(totalTimeSpent)}`}
        </p>
      </div>
    </div>
  )
}

interface CourseStatsCardProps {
  courseId: string
  timeRange: "1d" | "7d" | "30d" | "custom"
  dateRange: DateRange | undefined
}

function CourseStatsCard({ courseId, timeRange, dateRange }: CourseStatsCardProps) {
  const { data: course, isLoading: isCourseLoading } = useGetCourseStatsQuery(courseId)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatChartTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }

  if (isCourseLoading) return <Skeleton className="h-[200px] w-full" />
  if (!course) return null

  // Filter data based on date range
  const filteredData = course.dailyData.filter((day: { date: string }) => {
    if (!dateRange?.from || !dateRange?.to) return true
    const dayDate = new Date(day.date)
    return dayDate >= dateRange.from && dayDate <= dateRange.to
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{course.title}</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Time: </span>
            <span className="font-medium">{formatTime(course.totalDuration)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Active Users: </span>
            <span className="font-medium">{course.totalUsers}</span>
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), "MMM dd")}
            />
            <YAxis 
              tickFormatter={formatChartTime}
            />
            <Tooltip 
              formatter={(value: number) => [formatTime(value), "Time Spent"]}
              labelFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="duration" 
              stroke="#2563eb" 
              name="Time Spent"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), "MMM dd")}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
            />
            <Legend />
            <Bar 
              dataKey="activeUsers" 
              fill="#2563eb" 
              name="Active Users"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 