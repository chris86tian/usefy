"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, UserCheck, UserX, Users } from 'lucide-react'
import { getUserName, handleEnroll } from "@/lib/utils"
import { useCreateTransactionMutation, useUnenrollUserMutation } from "@/state/api"
import { toast } from "sonner"
import type { User } from "@clerk/nextjs/server"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ManageUsersDialogProps {
  isOpen: boolean
  onClose: () => void
  course: Course | null
  cohortLearners: User[]
  onSuccess: () => void
}

const ManageUsersDialog = ({ isOpen, onClose, course, cohortLearners, onSuccess }: ManageUsersDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"enroll" | "unenroll">("enroll")
  const [createTransaction] = useCreateTransactionMutation()
  const [unenrollUser] = useUnenrollUserMutation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEnrollAllDialogOpen, setIsEnrollAllDialogOpen] = useState(false)
  const [isEnrollingAll, setIsEnrollingAll] = useState(false)

  // Filter learners based on enrollment status and search term
  const filteredLearners = cohortLearners.filter((learner) => {
    const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === learner.id)

    // For enroll tab, show unenrolled users; for unenroll tab, show enrolled users
    const matchesEnrollmentStatus = activeTab === "enroll" ? !isEnrolled : isEnrolled

    const matchesSearch =
      getUserName(learner)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.emailAddresses[0].emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch && matchesEnrollmentStatus
  })

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleEnrollUsers = async () => {
    if (!course || selectedUsers.length === 0) {
      toast.error("Please select at least one user to enroll")
      return
    }

    setIsProcessing(true)

    try {
      // Process enrollments sequentially to avoid overwhelming the API
      for (const userId of selectedUsers) {
        await handleEnroll(userId, course.courseId, createTransaction)
      }

      toast.success(`Successfully enrolled ${selectedUsers.length} user(s) in ${course.title}`)
      setSelectedUsers([])
      setSearchTerm("")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Failed to enroll users:", error)
      toast.error("Failed to enroll some users. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnenrollUsers = async () => {
    if (!course || selectedUsers.length === 0) {
      toast.error("Please select at least one user to unenroll")
      return
    }

    setIsProcessing(true)

    try {
      // Process unenrollments sequentially
      for (const userId of selectedUsers) {
        await unenrollUser({
          courseId: course.courseId,
          userId: userId,
        })
      }

      toast.success(`Successfully unenrolled ${selectedUsers.length} user(s) from ${course.title}`)
      setSelectedUsers([])
      setSearchTerm("")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Failed to unenroll users:", error)
      toast.error("Failed to unenroll some users. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnrollAllLearners = async () => {
    if (!course) {
      toast.error("No course selected")
      return
    }

    setIsEnrollingAll(true)
    
    try {
      // Get all unenrolled learners
      const unenrolledLearners = cohortLearners.filter(
        (learner) => !course.enrollments?.some((enrollment) => enrollment.userId === learner.id)
      )
      
      if (unenrolledLearners.length === 0) {
        toast.info("All learners are already enrolled in this course")
        setIsEnrollAllDialogOpen(false)
        setIsEnrollingAll(false)
        return
      }
      
      const totalLearners = unenrolledLearners.length
      let enrolledCount = 0
      let failedCount = 0
      
      // Create a toast that we'll update
      const toastId = toast.loading(`Enrolling 0/${totalLearners} learners...`)
      
      for (const learner of unenrolledLearners) {
        try {
          await handleEnroll(learner.id, course.courseId, createTransaction)
          enrolledCount++
          
          // Update the toast message
          toast.loading(`Enrolling ${enrolledCount}/${totalLearners} learners...`, { id: toastId })
        } catch (error) {
          failedCount++
          console.error(`Failed to enroll learner ${learner.id}:`, error)
        }
      }
      
      // Dismiss the loading toast and show the final result
      toast.dismiss(toastId)
      
      if (failedCount === 0) {
        toast.success(`Successfully enrolled all ${enrolledCount} learners in the course`)
      } else {
        toast.warning(`Enrolled ${enrolledCount} learners, but failed to enroll ${failedCount} learners`)
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Failed to enroll all learners:", error)
      toast.error("Failed to enroll learners. Please try again.")
    } finally {
      setIsEnrollingAll(false)
      setIsEnrollAllDialogOpen(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "enroll" | "unenroll")
    setSelectedUsers([])
  }

  const resetDialog = () => {
    setSelectedUsers([])
    setSearchTerm("")
    setActiveTab("enroll")
    setIsEnrollAllDialogOpen(false)
    onClose()
  }

  const enrolledCount = course?.enrollments?.filter((enrollment) => 
    cohortLearners.some((learner) => learner.id === enrollment.userId)
  ).length || 0
  
  const unenrolledCount = cohortLearners.filter((learner) => 
    !course?.enrollments?.some((enrollment) => enrollment.userId === learner.id)
  ).length || 0

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Course Enrollments</DialogTitle>
            <DialogDescription>
              {course ? `Manage user enrollments for ${course.title}` : "Select a course first"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enroll" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Enroll Users
                <Badge variant="outline" className="ml-1">
                  {unenrolledCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unenroll" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Unenroll Users
                <Badge variant="outline" className="ml-1">
                  {enrolledCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enroll" className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="mt-2 flex justify-between items-center">
                <Label className="text-sm font-medium">{selectedUsers.length} user(s) selected for enrollment</Label>
                {unenrolledCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEnrollAllDialogOpen(true)}
                    disabled={isProcessing}
                    className="gap-1"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Enroll All ({unenrolledCount})
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                {filteredLearners.length > 0 ? (
                  filteredLearners.map((learner) => (
                    <div
                      key={learner.id}
                      className={`flex items-center justify-between p-3 hover:bg-accent cursor-pointer ${
                        selectedUsers.includes(learner.id) ? "bg-accent" : ""
                      }`}
                      onClick={() => handleUserSelect(learner.id)}
                    >
                      <div>
                        <p className="font-medium">{getUserName(learner)}</p>
                        <p className="text-sm text-muted-foreground">{learner.emailAddresses[0].emailAddress}</p>
                      </div>
                      {selectedUsers.includes(learner.id) && <UserCheck className="h-5 w-5 text-primary" />}
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-center text-muted-foreground">
                    {searchTerm ? "No matching users found" : "All users are already enrolled"}
                  </p>
                )}
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEnrollUsers}
                  disabled={selectedUsers.length === 0 || isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Enroll Selected Users
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="unenroll" className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search enrolled users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="mt-2">
                <Label className="text-sm font-medium">{selectedUsers.length} user(s) selected for unenrollment</Label>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                {filteredLearners.length > 0 ? (
                  filteredLearners.map((learner) => (
                    <div
                      key={learner.id}
                      className={`flex items-center justify-between p-3 hover:bg-accent cursor-pointer ${
                        selectedUsers.includes(learner.id) ? "bg-accent" : ""
                      }`}
                      onClick={() => handleUserSelect(learner.id)}
                    >
                      <div>
                        <p className="font-medium">{getUserName(learner)}</p>
                        <p className="text-sm text-muted-foreground">{learner.emailAddresses[0].emailAddress}</p>
                      </div>
                      {selectedUsers.includes(learner.id) && <UserX className="h-5 w-5 text-destructive" />}
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-center text-muted-foreground">
                    {searchTerm ? "No matching enrolled users found" : "No users are currently enrolled"}
                  </p>
                )}
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUnenrollUsers}
                  disabled={selectedUsers.length === 0 || isProcessing}
                  variant="destructive"
                  className="gap-2"
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <UserX className="h-4 w-4" />
                      Unenroll Selected Users
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Enroll All Confirmation Dialog */}
      <AlertDialog open={isEnrollAllDialogOpen} onOpenChange={setIsEnrollAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enroll All Cohort Learners</AlertDialogTitle>
            <AlertDialogDescription>
              This will enroll all {unenrolledCount} unenrolled learners in the course &quot;{course?.title}&quot;. 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEnrollAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEnrollAllLearners}
              disabled={isEnrollingAll}
              className="bg-primary"
            >
              {isEnrollingAll ? "Enrolling..." : "Enroll All Learners"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ManageUsersDialog
