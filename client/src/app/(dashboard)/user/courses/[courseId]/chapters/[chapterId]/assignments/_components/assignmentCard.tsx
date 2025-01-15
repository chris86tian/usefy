import { useState } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Trash2, 
  Edit, 
  CodeIcon,
  Link as LinkIcon,
  Users,
  ChevronDown,
  ExternalLink,
  Info
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useDeleteAssignmentMutation } from '@/state/api'
import { useRouter } from 'next/navigation'
import AssignmentModal from '../../_components/AssignmentModal'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [isHintsOpen, setIsHintsOpen] = useState(false) // State to toggle viewing hints

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
    <>
      <Card className="bg-gray-800 border-gray-700 overflow-hidden p-2">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{assignment.title}</h3>
            </div>
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
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{assignment.submissions.length} Submissions</span>
            </div>
          </div>

          <Collapsible
            open={isResourcesOpen}
            onOpenChange={setIsResourcesOpen}
            className="mt-4"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Resources & Materials
                <ChevronDown className={`h-4 w-4 transition-transform ${isResourcesOpen ? 'transform rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {assignment.resources && assignment.resources.length > 0 ? (
                assignment.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-700">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{resource.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <Alert>
                  <AlertDescription>
                    No additional resources provided for this assignment.
                  </AlertDescription>
                </Alert>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={isHintsOpen}
            onOpenChange={setIsHintsOpen}
            className="mt-4"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Hints
                <ChevronDown className={`h-4 w-4 transition-transform ${isHintsOpen ? 'transform rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {assignment.hints && assignment.hints.length > 0 ? (
                assignment.hints.map((hint, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-700">
                    <Info className="h-4 w-4 mr-1 text-green-400" />
                    <span className="text-sm">{hint}</span>
                  </div>
                ))
              ) : (
                <Alert>
                  <AlertDescription>
                    No hints provided for this assignment.
                  </AlertDescription>
                </Alert>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={handleStartAssignment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CodeIcon className="h-4 w-4 mr-2" />
            Start Assignment
          </Button>
        </CardFooter>
      </Card>

      {isModalOpen && (
        <AssignmentModal
          mode="edit"
          assignment={assignment}
          courseId={courseId}
          sectionId={sectionId}
          chapterId={chapterId}
          onAssignmentChange={() => {
            setIsModalOpen(false)
            router.refresh()
          }}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  )
}
