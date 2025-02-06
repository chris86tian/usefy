'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGetCourseUsersQuery } from '@/state/api'


export default function UserList({ courseId, selectedUser, onUserSelect }: UserListProps) {
  const { data: users } = useGetCourseUsersQuery(courseId)

  if (!users || users?.length === 0) {
    return (
      <Card className="bg-zinc-900">
        <CardHeader>
            <CardTitle>Course Users</CardTitle>
        </CardHeader>
        <CardContent>No users found for this course</CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900">
      <CardHeader>
        <CardTitle>Course Users</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md">
          <div className="px-4">
            <ul className="space-y-4">
              {users.map((user) => (
                <li 
                  key={user.id} 
                  className={`flex items-center space-x-4 p-4 rounded-md cursor-pointer border border-transparent hover:border-accent ${
                    selectedUser?.id === user.id ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => onUserSelect(user as unknown as User)}
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
    </Card>
  )
}