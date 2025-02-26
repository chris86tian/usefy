"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, BookOpen, Calendar } from "lucide-react"
// import { CourseCard } from "@/components/course-card"

interface SelectedOrganizationProps {
  organization: Organization
  handleJoinOrg: (orgId: string) => void
  userId: string
}

export function SelectedOrganization({ organization, handleJoinOrg, userId }: SelectedOrganizationProps) {
  const isUserMember =
    organization.admins.includes(userId) ||
    organization.instructors.includes(userId) ||
    organization.learners.includes(userId)

  return (
    <Card className="h-full bg-gray-800 border border-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                {organization.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{organization.name}</CardTitle>
              <CardDescription className="text-base">{organization.description}</CardDescription>
            </div>
          </div>
          {!isUserMember && 
            <Button 
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => handleJoinOrg(organization.id)}>
                Join Organization
            </Button>
          }
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {organization.admins.length + organization.instructors.length + organization.learners.length} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{organization.courses.length} courses</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="courses" className="w-full">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="courses" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* {organization.courses.map((course) => (
                <CourseCard key={course} course={course} />
              ))} */}
            </div>
          </TabsContent>
          <TabsContent value="members" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Admins</h3>
                <div className="grid grid-cols-2 gap-4">
                  {organization.admins.map((admin) => (
                    <Card key={admin}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>AD</AvatarFallback>
                          </Avatar>
                          <div className="text-sm">{admin}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Instructors</h3>
                <div className="grid grid-cols-2 gap-4">
                  {organization.instructors.map((instructor) => (
                    <Card key={instructor}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>IN</AvatarFallback>
                          </Avatar>
                          <div className="text-sm">{instructor}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="about" className="mt-4">
            <div className="prose prose-sm dark:prose-invert">
              <p>{organization.description}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

