"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetUsersQuery, useUnenrollUserMutation } from "@/state/api"
import { User } from "@clerk/nextjs/server"
import { toast } from "sonner"
import { useCreateTransactionMutation } from "@/state/api";
import { useUser } from "@clerk/nextjs"

interface EnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  enrolledUsers: User[]
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, courseId, enrolledUsers }) => {
  const { data: users } = useGetUsersQuery()
  const [ unenrollUser ] = useUnenrollUserMutation()
  const [ createTransaction ] = useCreateTransactionMutation()
  const { user: currentUser } = useUser()

  const filteredUsers = users?.filter((user: User) => user.id !== currentUser?.id)

  const handleEnroll = async (userId: string) => {
    try {
        const transactionData: Partial<Transaction> = {
            transactionId: "free-enrollment",
            userId: userId,
            courseId: courseId,
            paymentProvider: undefined,
            amount: 0,
        };
    
        await createTransaction(transactionData);
        toast.success("Enrolled user successfully!");
    } catch (error) {
        console.error("Failed to send email:", error);
        toast.error("Enrolled successfully, but failed to send email.");
    }
  }

  const handleUnenroll = async (userId: string) => {
    try {
      await unenrollUser({ courseId, userId })
    } catch (error) {
      console.error("Failed to unenroll user:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Course Enrollment</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {filteredUsers?.map((user: User) => {
            const isEnrolled = enrolledUsers.some((enrolledUser) => enrolledUser.id === user.id)
            return (
              <div key={user.id} className="flex items-center justify-between mb-4 last:mb-0">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.imageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback>{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.publicMetadata.userType === "teacher" ? "Teacher" : "Student"}
                    </p>
                  </div>
                </div>
                {isEnrolled ? (
                  <Button variant="destructive" size="sm" onClick={() => handleUnenroll(user.id)}>
                    Unenroll
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleEnroll(user.id)}>
                    Enroll
                  </Button>
                )}
              </div>
            )
          })}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default EnrollmentModal

