import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Clock, Trash2, Edit, CodeIcon } from 'lucide-react'
import { Assignment } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { useDeleteAssignmentMutation } from '@/state/api'
import { useRouter } from 'next/navigation'
import AssignmentModal from '../../_components/assignmentModal'

interface AssignmentCardProps {
  assignment: Assignment
  teacherId: string
  courseId: string
  sectionId: string
  chapterId: string
}
  
export function AssignmentCard({ 
  assignment, 
  teacherId, 
  courseId, 
  sectionId, 
  chapterId 
}: AssignmentCardProps) {
  const { user } = useUser()
  const router = useRouter()
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteAssignment({
        assignmentId: assignment.assignmentId,
        courseId,
        sectionId,
        chapterId
      }).unwrap()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  const handleStartAssignment = () => {
    router.push(`/user/courses/${courseId}/chapters/${chapterId}/code?courseId=${courseId}&sectionId=${sectionId}&chapterId=${chapterId}&assignmentId=${assignment.assignmentId}`)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Card className="p-4 bg-gray-800 border-gray-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{assignment.title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              {user?.id === teacherId && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsModalOpen(true)
                    }}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{assignment.description}</p>
          <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Submissions: {assignment.submissions.length}
              </span>
            </div>
            <Button 
              onClick={handleStartAssignment}
              className='bg-gray-700 hover:bg-gray-600 text-white'
            >
              <CodeIcon className="h-4 w-4 mr-1" />
              Start Now
            </Button>
          </div>
        </div>
      </Card>

      {isModalOpen && (
        <AssignmentModal
          mode="edit"
          assignment={assignment}
          courseId={courseId}
          sectionId={sectionId}
          chapterId={chapterId}
          onAssignmentChange={() => {
            handleModalClose()
            // Optionally refresh the data here if needed
            router.refresh()
          }}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  )
}