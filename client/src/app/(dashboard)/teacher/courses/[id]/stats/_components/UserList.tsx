'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGetCourseUsersQuery } from '@/state/api'
import { UserDetailsModal } from '@/app/(dashboard)/teacher/users/_components/UserDetailsModal'
import { User } from '@/lib/utils'

  
interface UserListProps {
  courseId: string
}

export default function UserList({ courseId }: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { data: users } = useGetCourseUsersQuery(courseId)

  console.log(users)

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
  }

  if (!users) {
    return (
      <Card className="h-full">
        <CardHeader>
            <CardTitle>Course Users</CardTitle>
        </CardHeader>
        <CardContent>Loading users...</CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-gray-900">
      <CardHeader>
        <CardTitle>Course Users</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md">
          <div className="p-4">
            <ul className="space-y-4">
              {users.map((user) => (
                <li 
                  key={user.id} 
                  className={`flex items-center space-x-4 cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors ${
                    selectedUser?.id === user.id ? 'bg-accent text-accent-foreground' : ''
                  }`}
                    onClick={() => handleUserClick(user as unknown as User)}
                >
                  <Avatar>
                    <AvatarImage src={user.imageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback>{`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.publicMetadata.userType === 'teacher' ? 'Teacher' : 'Student'}
                    </p>
                  </div>
                  {user.banned && (
                    <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                      Banned
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </CardContent>
      {selectedUser && (
        <UserDetailsModal
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            user={selectedUser}
            courseId={courseId}
        />
       )}
    </Card>
  )
}

