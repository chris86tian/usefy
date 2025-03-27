"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserName } from "@/lib/utils"
import { useGetCourseUsersQuery } from "@/state/api"
import { User } from "@clerk/nextjs/server"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface UserListProps {
  courseId: string
  selectedUser: User | undefined
  onUserSelect: (user: User) => void
}

export default function UserList({ courseId, selectedUser, onUserSelect }: UserListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(10)
  const { data: response } = useGetCourseUsersQuery({ 
    courseId, 
    page: currentPage, 
    limit: usersPerPage 
  })

  const users = response?.users || []
  const pagination = response?.pagination

  return (
    <Card className="p-2">
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md">
          <div>
            {!users || users.length === 0 ? (
              <p className="text-center py-2">No users found for this course</p>
            ) : (
              <>
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
                {pagination && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {users.length > 0 ? (currentPage - 1) * usersPerPage + 1 : 0} to{" "}
                      {Math.min(currentPage * usersPerPage, pagination.total)} of {pagination.total} users
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {pagination.totalPages || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

