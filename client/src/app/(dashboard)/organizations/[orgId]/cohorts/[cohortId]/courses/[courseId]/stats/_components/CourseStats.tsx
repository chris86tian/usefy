"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetCourseQuery, useGetCourseStatsQuery, useGetUserCourseProgressQuery } from "@/state/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Book, Users, Layers, FileText, Clock, UserCheck } from "lucide-react"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, parseISO } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
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
import ChapterStats from "./ChapterStats";
import { useUser } from "@clerk/nextjs"

interface CourseStatsProps {
  courseId: string
}

interface DailyData {
  date: string;
  duration: number;
  activeUsers: number;
}

function hasValidDateRange(dateRange: DateRange | undefined): dateRange is { from: Date; to: Date } {
  return dateRange?.from instanceof Date && dateRange?.to instanceof Date;
}

// Helper functions
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatChartTime(value: number): string {
  const formattedTime = formatTime(value);
  return formattedTime.replace('h', 'h').replace('m', 'm');
}

function calculateChapterCompletionRate(chapter: any): number {
  // This should be replaced with actual completion rate calculation
  // For now, returning a mock value
  return Math.random() * 100;
}

export default function CourseStats({ courseId }: CourseStatsProps) {
  const { user } = useUser();
  const { data: course, isLoading: isCourseLoading } = useGetCourseQuery(courseId)
  const { data: courseStats, isLoading: isStatsLoading } = useGetCourseStatsQuery(courseId)
  const { data: userProgress } = useGetUserCourseProgressQuery({ 
    userId: user?.id as string, 
    courseId 
  }, { skip: !user?.id })
  const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d" | "custom">("7d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  // Add console logging to debug data structure
  console.log('Course:', course);
  console.log('CourseStats:', courseStats);

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

  if (isCourseLoading || isStatsLoading) {
    return <LoadingSkeleton />
  }

  if (!course) {
    return <div>No course data available.</div>
  }

  // Calculate total chapters and get all chapter IDs
  const totalChapters = course.sections.reduce((acc, section) => acc + section.chapters.length, 0)
  const allChapterIds = course.sections.flatMap(section => 
    section.chapters.map(chapter => chapter.chapterId)
  )

  // Calculate completion rates per chapter
  const chapterCompletionRates = course.sections.flatMap(section =>
    section.chapters.map(chapter => {
      const sectionProgress = userProgress?.sections?.find(s => s.sectionId === section.sectionId);
      const chapterProgress = sectionProgress?.chapters?.find(c => c.chapterId === chapter.chapterId);
      
      return {
        chapterId: chapter.chapterId,
        title: chapter.title,
        sectionTitle: section.sectionTitle,
        completionRate: chapterProgress?.completed ? 100 : 0
      };
    })
  )

  // Filter data based on date range
  const filteredData = hasValidDateRange(dateRange)
    ? (courseStats?.dailyData || []).filter((day: DailyData) => {
        const dayDate = new Date(day.date);
        return dayDate >= dateRange.from && dayDate <= dateRange.to;
      })
    : courseStats?.dailyData || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Enrollments"
          value={course.enrollments?.length || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="Students enrolled in the course"
        />
        <StatCard
          title="Total Sections"
          value={course.sections.length}
          icon={<Book className="h-4 w-4 text-muted-foreground" />}
          description="Number of course sections"
        />
        <StatCard
          title="Total Chapters"
          value={totalChapters}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="Total chapters across all sections"
        />
        <StatCard
          title="Active Users"
          value={courseStats?.totalUsers || 0}
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
          description="Users who accessed the course in selected period"
        />
      </div>

      <div className="flex items-center space-x-4">
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
                  "w-[300px] justify-start text-left font-normal",
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
              <Calendar
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

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(courseStats?.totalDuration || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time/User</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(courseStats?.averageDurationPerUser || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStats?.totalLogins || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                  />
                  <YAxis 
                    tickFormatter={formatChartTime}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatTime(value), "Time Spent"]}
                    labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Users & Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Bar 
                    dataKey="activeUsers" 
                    fill="#2563eb" 
                    name="Active Users"
                  />
                  <Bar 
                    dataKey="logins" 
                    fill="#22c55e" 
                    name="Logins"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container py-8 space-y-8">
        <h1 className="text-2xl font-bold">{course?.title}</h1>
        
        {course?.sections.map((section) => (
          <div key={section.sectionId} className="space-y-6">
            <h2 className="text-xl font-semibold">Section: {section.sectionTitle}</h2>
            {section.chapters.map((chapter) => (
              <div key={chapter.chapterId} className="bg-card p-2 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Chapter: {chapter.title}</h3>
                <ChapterStats 
                  courseId={course.courseId} 
                  chapterId={chapter.chapterId}
                  completionRate={chapterCompletionRates.find(c => c.chapterId === chapter.chapterId)?.completionRate || 0}
                  timeRange={timeRange}
                  dateRange={dateRange}
                  chapterIds={allChapterIds}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  description: string
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-4 w-[120px] mt-2" />
          </CardContent>
        </Card>
      ))}
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

