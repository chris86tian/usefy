'use client'

import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetUserCourseProgressQuery, useGetUserCourseSubmissionsQuery } from '@/state/api'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Book, Trophy } from 'lucide-react'
import { User } from '@/lib/utils'

interface UserDetailsProps {
  user: User
  courseId: string
}

export default function UserDetails({ user, courseId }: UserDetailsProps) {
  const { data: progress } = useGetUserCourseProgressQuery({ userId: user.id, courseId })
  const { data: submissions } = useGetUserCourseSubmissionsQuery({ userId: user.id, courseId })
  
  console.log(submissions)

  if(!progress || !submissions) {
    return (
      <Card className="h-min bg-gray-900">
        <CardHeader>
          <CardTitle>{user.firstName} {user.lastName}</CardTitle>
        </CardHeader>
        <CardContent>Loading user details...</CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-min bg-gray-900">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.imageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback>{`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">
              {user.firstName} {user.lastName}
            </CardTitle>
            <Badge variant="secondary">
              {user.publicMetadata.userType === 'teacher' ? 'Teacher' : 'Student'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Active</p>
                    <p className="text-xs text-muted-foreground">
                      {progress?.lastAccessedTimestamp
                        ? new Date(progress.lastAccessedTimestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-2">
                  <Book className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Enrolled On</p>
                    <p className="text-xs text-muted-foreground">
                      {progress?.enrollmentDate
                        ? new Date(progress.enrollmentDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Overall Progress</p>
                    <p className="text-xs text-muted-foreground">
                      {progress?.overallProgress ? `${progress.overallProgress.toFixed(0)}% Complete` : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Progress */}
            {progress && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Progress Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {progress.sections.map((section) => (
                    <div key={section.sectionId} className="space-y-4">
                      <h3 className="font-medium">Section {section.sectionId}</h3>
                      <div className="space-y-2">
                        {section.chapters.map((chapter) => (
                          <div 
                            key={chapter.chapterId}
                            className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                          >
                            <span className="text-sm">Chapter {chapter.chapterId}</span>
                            <div className="flex items-center gap-3">
                              {chapter.quizCompleted && (
                                <Badge variant="secondary">Quiz Complete</Badge>
                              )}
                              <Badge variant={chapter.completed ? "default" : "secondary"}>
                                {chapter.completed ? 'Completed' : 'In Progress'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* User Submissions */}
            {submissions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Submissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submissions?.map((submission) => (
                    <div key={submission.submissionId} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{submission.assignmentTitle}</p>
                        <p className="text-xs text-muted-foreground">{submission.evaluation.explanation}</p>
                      </div>
                      <Badge variant={submission.evaluation?.passed ? "default" : "secondary"}>
                        {submission.evaluation?.passed ? `Passed (${submission.evaluation.score})` : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
