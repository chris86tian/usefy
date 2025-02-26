"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, BookOpen } from "lucide-react"
import CourseCard from "@/components/CourseCard"

interface Course {
  id: string
  title: string
  description: string
  imageUrl: string
}

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
          {!isUserMember && (
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => handleJoinOrg(organization.organizationId)}
            >
              Join Organization
            </Button>
          )}
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
          </TabsList>
          <TabsContent value="courses" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* {organization.courses.map((course) => (
                <CourseCard key={course} course={} />
              ))} */}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

