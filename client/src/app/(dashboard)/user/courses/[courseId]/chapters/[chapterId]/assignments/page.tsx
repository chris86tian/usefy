'use client'

import React from 'react'
import { useGetAssignmentsQuery } from '@/state/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssignmentCard } from './_components/AssignmentCard'
import { AssignmentsSkeleton } from './_components/AssignmentsSkeleton'
import { AssignmentsError } from './_components/AssignmentsError'
import { EmptyAssignments } from './_components/EmptyAssignments'

export default function Assignments ({ teacherId, courseId, chapterId, sectionId }: AssignmentsProps) {
  const { data: assignments, isLoading, error } = useGetAssignmentsQuery({ chapterId, sectionId, courseId })

  const renderContent = () => {
    if (isLoading) return <AssignmentsSkeleton columns={2} />
    if (error) return <AssignmentsError />
    if (!assignments?.length) return <EmptyAssignments />

    return (
      <div className="grid grid-cols-2 gap-4">
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
    )
  }

  return (
    <Card className="h-full bg-gray-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Assignments</CardTitle>
        {(assignments?.length ?? 0) > 0 && (
          <span className="text-sm text-gray-400">
            {assignments?.length} {assignments?.length === 1 ? 'Assignment' : 'Assignments'}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto pr-4">
          {renderContent()}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}