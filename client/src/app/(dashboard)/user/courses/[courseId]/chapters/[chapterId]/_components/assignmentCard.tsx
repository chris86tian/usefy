import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Clock, Trash2 } from 'lucide-react'
import { Assignment } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { useDeleteAssignmentMutation } from '@/state/api'
import { useRouter } from 'next/navigation'

interface AssignmentCardProps {
  assignment: Assignment
  teacherId: string
  courseId: string
  sectionId: string
  chapterId: string
}
  
export function AssignmentCard({ assignment, teacherId, courseId, sectionId, chapterId }: AssignmentCardProps) {
  const { user } = useUser()
  const router = useRouter()
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation()

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

  return (
    <Card className="p-4 bg-gray-800 hover:bg-gray-700/50 cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{assignment.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {assignment.submissions.length === 0 ? 'Not Started' : 'In Progress'}
            </Badge>
            {user?.id === teacherId && (
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
            Start Now
          </Button>
        </div>
      </div>
    </Card>
  )
}