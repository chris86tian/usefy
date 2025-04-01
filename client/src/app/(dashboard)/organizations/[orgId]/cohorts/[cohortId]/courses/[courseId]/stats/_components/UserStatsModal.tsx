"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetUserCourseProgressQuery, useGetUserCourseSubmissionsQuery, useGetUserCourseTimeTrackingQuery } from "@/state/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Book, Trophy, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { User } from "@clerk/nextjs/server"
import { getUserName } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

interface UserStatsModalProps {
  user: User
  courseId: string
  isOpen: boolean
  onClose: () => void
}

export default function UserStatsModal({ user, courseId, isOpen, onClose }: UserStatsModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: progress, isLoading: isProgressLoading, error: progressError } = useGetUserCourseProgressQuery({ userId: user.id, courseId })
  const { data: submissions, isLoading: isSubmissionsLoading, error: submissionsError } = useGetUserCourseSubmissionsQuery({
    userId: user.id,
    courseId,
  })
  const { data: timeTracking, error: timeTrackingError, isLoading: isTimeTrackingLoading } = useGetUserCourseTimeTrackingQuery(
    {
      userId: user.id,
      courseId: courseId,
    },
    {
      skip: !user?.id || !courseId,
    }
  )

  const isLoading = isProgressLoading || isSubmissionsLoading || isTimeTrackingLoading

  // Handle errors
  useEffect(() => {
    if (progressError) {
      console.error('Progress Error:', progressError);
    }
    if (submissionsError) {
      console.error('Submissions Error:', submissionsError);
    }
    if (timeTrackingError) {
      console.error('Time Tracking Error:', timeTrackingError);
      // Show toast for throttling errors with more detailed message
      if (timeTrackingError.isThrottled) {
        toast.error(
          "DynamoDB Provisioned Throughput Exceeded. Please wait a moment before trying again.",
          {
            duration: 5000,
            position: 'top-center'
          }
        );
      }
    }
  }, [progressError, submissionsError, timeTrackingError]);

  const filteredSubmissions = submissions?.filter((submission) =>
    submission.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || []

  // Calculate total time spent on the course
  const totalTimeSpent = useMemo(() => {
    if (!timeTracking?.length) return 0;
    console.log('Calculating total time from records:', timeTracking);
    const total = timeTracking.reduce((sum, record) => {
      const durationMs = Number(record.durationMs) || 0;
      console.log('Record duration:', durationMs);
      return sum + durationMs;
    }, 0);
    console.log('Total time calculated:', total);
    return total;
  }, [timeTracking]);

  // Calculate time spent per chapter
  const timePerChapter = useMemo(() => {
    if (!timeTracking?.length) return {};
    console.log('Calculating time per chapter from records:', timeTracking);
    const chapterTimes = timeTracking.reduce((acc, record) => {
      const chapterId = record.chapterId;
      const durationMs = Number(record.durationMs) || 0;
      if (!acc[chapterId]) acc[chapterId] = 0;
      acc[chapterId] += durationMs;
      console.log(`Chapter ${chapterId} time:`, acc[chapterId]);
      return acc;
    }, {} as Record<string, number>);
    console.log('Time per chapter calculated:', chapterTimes);
    return chapterTimes;
  }, [timeTracking]);

  // Format time helper function
  const formatTime = (ms: number) => {
    if (!ms) return "0h 0m";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Debug logging
  useEffect(() => {
    console.log('Time tracking data:', timeTracking);
    console.log('Total time spent:', totalTimeSpent);
    console.log('Time per chapter:', timePerChapter);
  }, [timeTracking, totalTimeSpent, timePerChapter]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-lg">{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {getUserName(user)}
                </DialogTitle>
                <DialogDescription>
                  Detailed statistics and progress for this user
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-8">
            {/* User Stats */}
            <div className="grid grid-cols-4 gap-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : timeTrackingError?.isThrottled ? (
                <div className="col-span-4 p-4 text-yellow-600 bg-yellow-50 rounded-md">
                  <p className="font-medium">DynamoDB Provisioned Throughput Exceeded</p>
                  <p className="text-sm mt-1">The request rate is too high. Please wait a moment before trying again.</p>
                  <p className="text-xs mt-2 text-yellow-700">This is a temporary limitation. The system will automatically retry.</p>
                </div>
              ) : (
                <>
                  <StatCard
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    title="Last Active"
                    value={
                      progress?.lastAccessedTimestamp
                        ? new Date(progress.lastAccessedTimestamp).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"
                    }
                  />
                  <StatCard
                    icon={<Book className="h-5 w-5 text-primary" />}
                    title="Enrolled On"
                    value={
                      progress?.enrollmentDate
                        ? new Date(progress.enrollmentDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"
                    }
                  />
                  <StatCard
                    icon={<Trophy className="h-5 w-5 text-primary" />}
                    title="Overall Progress"
                    value={
                      progress?.overallProgress ? `${progress.overallProgress.toFixed(0)}% Complete` : "0% Complete"
                    }
                  />
                  <StatCard
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    title="Total Time Spent"
                    value={
                      timeTrackingError?.isThrottled 
                        ? "Request limit reached" 
                        : timeTrackingError 
                          ? "Error loading" 
                          : formatTime(totalTimeSpent)
                    }
                  />
                </>
              )}
            </div>

            {/* Detailed Progress */}
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : timeTrackingError?.isThrottled ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Course Progress Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 text-yellow-600 bg-yellow-50 rounded-md">
                    <p className="font-medium">DynamoDB Provisioned Throughput Exceeded</p>
                    <p className="text-sm mt-1">The request rate is too high. Please wait a moment before trying again.</p>
                    <p className="text-xs mt-2 text-yellow-700">This is a temporary limitation. The system will automatically retry.</p>
                  </div>
                </CardContent>
              </Card>
            ) : progress ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Course Progress Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    {progress.sections.map((section, i) => (
                      <AccordionItem key={section.sectionId} value={`section-${section.sectionId}`}>
                        <AccordionTrigger className="text-lg flex justify-between items-center">
                          <span>Section {i + 1}</span>
                          {section.chapters.every(chapter => chapter.completed) && (
                            <Badge variant="default" className="ml-2">Completed</Badge>
                          )}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 mt-2">
                            {section.chapters.map((chapter, j) => (
                              <div
                                key={chapter.chapterId}
                                className="flex items-center justify-between bg-muted p-3 rounded-lg hover:bg-muted/80 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">Chapter {j + 1}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Time spent: {formatTime(timePerChapter[chapter.chapterId] || 0)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {chapter.quizCompleted && <Badge variant="secondary">Quiz Complete</Badge>}
                                  <Badge variant={chapter.completed ? "default" : "secondary"}>
                                    {chapter.completed ? "Completed" : "In Progress"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ) : null}

            {/* User Submissions */}
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              submissions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Assignment Submissions</CardTitle>
                    <div className="relative mt-2">
                      <Input
                        type="text"
                        placeholder="Search assignments"
                        className="toolbar__search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredSubmissions?.length ? (
                      filteredSubmissions.map((submission) => (
                        <div
                          key={submission.submissionId}
                          className="flex justify-between items-center bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{submission.assignmentTitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {submission.evaluation?.explanation || "No explanation available"}
                            </p>
                          </div>
                          <Badge variant={submission.evaluation?.passed ? "default" : "destructive"} className="ml-4">
                            {submission.evaluation?.passed ? `Passed (${submission.evaluation.score})` : "Failed"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No submissions found</p>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
}

function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="rounded-full bg-primary/10 p-3 mb-2">{icon}</div>
        <p className="text-sm font-medium mb-1">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  )
} 