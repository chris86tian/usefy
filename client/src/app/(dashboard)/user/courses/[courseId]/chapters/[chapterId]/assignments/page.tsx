'use client'

import React from 'react'
import { useGetAssignmentsQuery } from '@/state/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Assignment } from '@/lib/utils'
import { AssignmentCard } from '../_components/assignmentCard'

interface AssignmentsProps {
  chapterId: string
  sectionId: string
  courseId: string
  teacherId: string
}

export default function Assignments({ chapterId, sectionId, courseId, teacherId }: AssignmentsProps) {
  const { data: assignments, isLoading, error } = useGetAssignmentsQuery({ chapterId, sectionId, courseId })

  if (isLoading) {
    return <AssignmentsSkeleton />
  }

  if (error) {
    return <AssignmentsError />
  }

  return (
    <Card className="h-full bg-gray-900">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-320px)]">
          {!assignments?.length ? (
            <EmptyAssignments />
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment: Assignment) => (
                <AssignmentCard 
                  key={assignment.assignmentId} 
                  assignment={assignment}
                  teacherId={teacherId}
                  courseId={courseId}
                  sectionId={sectionId}
                  chapterId={chapterId}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

const AssignmentsSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-xl font-bold">Assignments</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </CardContent>
  </Card>
)

const AssignmentsError = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-xl font-bold">Assignments</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center justify-center h-40 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <span className="text-lg font-semibold">Failed to load assignments</span>
        <p className="text-sm text-center mt-2">
          Please check your internet connection and try again.
        </p>
      </div>
    </CardContent>
  </Card>
)

const EmptyAssignments = () => (
  <div className="text-center text-muted-foreground py-8">
    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p className="text-lg font-semibold">No assignments available</p>
    <p className="text-sm mt-2">Check back later for new assignments.</p>
  </div>
)

