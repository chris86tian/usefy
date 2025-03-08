'use client';

import React from 'react'
import { useGetAssignmentsQuery } from '@/state/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssignmentCard } from './_components/AssignmentCard'
import { AssignmentsSkeleton } from './_components/AssignmentsSkeleton'
import { AssignmentsError } from './_components/AssignmentsError'
import { EmptyAssignments } from './_components/EmptyAssignments'

const Assignments = ({ course, chapterId, sectionId }: AssignmentsProps) => {
  const { data: assignments, isLoading, error } = useGetAssignmentsQuery({ chapterId, sectionId, courseId: course.courseId })

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
            course={course}
            sectionId={sectionId}
            chapterId={chapterId}
          />
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-auto pt-4">
      {renderContent()}
    </ScrollArea>
  )
}

export default Assignments