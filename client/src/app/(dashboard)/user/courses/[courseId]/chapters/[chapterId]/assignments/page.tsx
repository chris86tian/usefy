'use client'

import React from 'react'
import { useGetAssignmentsQuery } from '@/state/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Assignment } from '@/lib/utils'
import { AssignmentCard } from './_components/assignmentCard'
import { AssignmentsSkeleton } from './_components/AssignmentsSkeleton'
import { AssignmentsError } from './_components/AssignmentsError'
import { EmptyAssignments } from './_components/EmptyAssignments'

interface AssignmentsProps {
  chapterId: string
  sectionId: string
  courseId: string
  teacherId: string
}

export default function Assignments({ chapterId, sectionId, courseId, teacherId }: AssignmentsProps) {
  const { data: assignments, isLoading, error } = useGetAssignmentsQuery({ chapterId, sectionId, courseId })

  return (
    <Card className="h-full bg-gray-900">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#e6e6e6]">Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-320px)]">
          {isLoading ? (
            <AssignmentsSkeleton />
          ) : error ? (
            <AssignmentsError />
          ) : !assignments?.length ? (
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

