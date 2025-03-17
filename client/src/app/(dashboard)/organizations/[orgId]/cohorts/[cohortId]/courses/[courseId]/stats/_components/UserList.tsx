"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserName } from "@/lib/utils"
import { useGetCourseUsersQuery } from "@/state/api"
import { User } from "@clerk/nextjs/server"

interface UserListProps {
  courseId: string
  selectedUser: User | undefined
  onUserSelect: (user: User) => void
}

export default function UserList({ courseId, selectedUser, onUserSelect }: UserListProps) {
  const { data: users } = useGetCourseUsersQuery(courseId)

  return (
    <Card className="p-2">
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md">
          <div>
            {!users || users.length === 0 ? (
              <p className="text-center py-2">No users found for this course</p>
            ) : (
              <ul className="space-y-2">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer border border-transparent hover:border-accent ${
                      selectedUser?.id === user.id ? "bg-accent text-accent-foreground" : ""
                    }`}
                    onClick={() => onUserSelect(user as unknown as User)}
                  >
                    <Avatar>
                      <AvatarImage src={user.imageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{getUserName(user)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

