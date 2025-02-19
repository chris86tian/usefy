"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useGetCourseUsersQuery } from "@/state/api"
import EnrollmentModal from "./EnrollmentModal"
import { User } from "@clerk/nextjs/server"
import { UserPlus2 } from "lucide-react"

interface UserListProps {
  courseId: string
  selectedUser: User | undefined
  onUserSelect: (user: User) => void
}

export default function UserList({ courseId, selectedUser, onUserSelect }: UserListProps) {
  const { data: users } = useGetCourseUsersQuery(courseId)
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false)

  return (
    <Card className="bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <Button variant={"outline"}
          onClick={() => setIsEnrollmentModalOpen(true)}>
            <UserPlus2 className="mr-2 h-4 w-4" />
            Manage Enrollment
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md">
          <div className="px-4">
            {!users || users.length === 0 ? (
              <p className="text-center py-4">No users found for this course</p>
            ) : (
              <ul className="space-y-4">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className={`flex items-center space-x-4 p-4 rounded-md cursor-pointer border border-transparent hover:border-accent ${
                      selectedUser?.id === user.id ? "bg-accent text-accent-foreground" : ""
                    }`}
                    onClick={() => onUserSelect(user as unknown as User)}
                  >
                    <Avatar>
                      <AvatarImage src={user.imageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.publicMetadata.userType === "teacher" ? "Teacher" : "Student"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <EnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        courseId={courseId}
        enrolledUsers={users || []}
      />
    </Card>
  )
}

