"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetCohortLearnersQuery, useGetUserCourseTimeTrackingQuery, useGetCourseQuery, useGetCourseStatsQuery } from "@/state/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Users, Book, Calendar } from "lucide-react"
import { useState } from "react"
import { User } from "@clerk/nextjs/server"
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

interface CohortStatsProps {
  cohort: {
    cohortId: string
    organizationId: string
    name: string
    courses: {
      courseId: string
    }[]
  }
}

export default function CohortStats({ cohort }: CohortStatsProps) {
  const { data: learners, isLoading: learnersLoading } = useGetCohortLearnersQuery({
    organizationId: cohort.organizationId,
    cohortId: cohort.cohortId,
  })

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d" | "custom">("7d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  const handleDateRangeSelect: SelectRangeEventHandler = (range) => {
    setDateRange(range)
  }

  const handleTimeRangeChange = (value: "1d" | "7d" | "30d" | "custom") => {
    setTimeRange(value)
    if (value !== "custom") {
      const days = value === "1d" ? 1 : value === "7d" ? 7 : 30
      setDateRange({
        from: subDays(new Date(), days),
        to: new Date(),
      })
    }
  }

  if (learnersLoading) return <Skeleton className="h-[400px] w-full" />
  if (!learners) return <div>No learners found</div>

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohort.courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learners.filter(learner => {
                const lastActive = learner.lastActiveAt
                if (!lastActive) return false
                const lastActiveDate = new Date(lastActive)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                return lastActiveDate >= thirtyDaysAgo
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Member Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {learners.map((learner) => (
                  <div
                    key={learner.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === learner.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedUser(learner)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{getUserName(learner)}</h3>
                        <p className="text-sm text-muted-foreground">{learner.emailAddresses[0].emailAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {learner.lastActiveAt
                            ? `Last active: ${format(new Date(learner.lastActiveAt), "MMM d, yyyy")}`
                            : "Never active"}
                        </Badge>
                      </div>
                    </div>
                    {selectedUser?.id === learner.id && (
                      <div className="mt-4 space-y-2">
                        {cohort.courses.map((course) => (
                          <UserCourseStats
                            key={course.courseId}
                            userId={learner.id}
                            courseId={course.courseId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Course Analytics</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                {timeRange === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {cohort.courses.map((course) => (
                  <CourseStatsCard
                    key={course.courseId}
                    courseId={course.courseId}
                    timeRange={timeRange}
                    dateRange={dateRange}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface UserCourseStatsProps {
  userId: string
  courseId: string
}

function UserCourseStats({ userId, courseId }: UserCourseStatsProps) {
  const { data: course, isLoading: isCourseLoading } = useGetCourseQuery(courseId)
  const { data: timeTracking, isLoading: isTimeTrackingLoading } = useGetUserCourseTimeTrackingQuery({
    userId,
    courseId,
  })

  const totalTimeSpent = timeTracking?.reduce((sum, record) => {
    const durationMs = Number(record.durationMs) || 0
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
          {isTimeTrackingLoading ? "Loading..." : `Time spent: ${formatTime(totalTimeSpent)}`}
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
  const { data: course, isLoading: isCourseLoading } = useGetCourseQuery(courseId)
  const { data: courseStats, isLoading: isStatsLoading } = useGetCourseStatsQuery(courseId)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatChartTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }

  if (isCourseLoading || isStatsLoading) return <Skeleton className="h-[200px] w-full" />
  if (!course || !courseStats) return null

  // Filter data based on date range
  const filteredData = courseStats.dailyData.filter((day: { date: string }) => {
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
            <span className="font-medium">{formatTime(courseStats.totalDuration)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Active Users: </span>
            <span className="font-medium">{courseStats.totalUsers}</span>
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