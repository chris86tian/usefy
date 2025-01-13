'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetUserCourseProgressQuery } from '@/state/api'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Book, Trophy } from 'lucide-react'
import { User } from '@/lib/utils'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  courseId: string
}

export function UserDetailsModal({ 
  isOpen, 
  onClose, 
  user,
  courseId
}: UserDetailsModalProps) {
  const { data: progress } = useGetUserCourseProgressQuery({
    userId: user.id,
    courseId,
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-background">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.imageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback>{`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">
                {user.firstName} {user.lastName}
              </DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {user.publicMetadata.userType === 'teacher' ? 'Teacher' : 'Student'}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[700px] pr-4">
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Active</p>
                    <p className="text-xs text-muted-foreground">{formatDate(user.lastActiveAt)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Book className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Joined Course</p>
                    <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Overall Progress</p>
                    <p className="text-xs text-muted-foreground">
                      {progress?.overallProgress.toFixed(0)}% Complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    progress: {
                      label: "Progress",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={user.stats}>
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="progress" fill="var(--color-progress)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}