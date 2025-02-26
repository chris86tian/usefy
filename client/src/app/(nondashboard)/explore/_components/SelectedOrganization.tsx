"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetCoursesByOrgQuery } from "@/state/api"
import CourseCard from "@/components/CourseCard"
import Loading from "@/components/Loading"
import { BadgeCheck, Users, BookOpen } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface SelectedOrganizationProps {
  organization: Organization
  handleJoinOrg: (orgId: string) => void
}

export function SelectedOrganization({ organization, handleJoinOrg }: SelectedOrganizationProps) {
  const { user } = useUser()
  const isUserMember =
    organization.admins.some(admin => admin.userId === user?.id) ||
    organization.instructors.some(instructor => instructor.userId === user?.id) ||
    organization.learners.some(learner => learner.userId === user?.id)

  const { data: courses, isLoading, isError } = useGetCoursesByOrgQuery(organization.organizationId)

  if (!courses) return null

  const totalMembers = (organization.admins?.length || 0) + 
                       (organization.instructors?.length || 0) + 
                       (organization.learners?.length || 0)

  return (
    <Card className="h-full overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl">
      <CardHeader className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 m-4 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900">
              {/* {organization.imageUrl ? (
                <AvatarImage src={organization.imageUrl} alt={organization.name} />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {organization.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              )} */}
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {organization.name}
              </CardTitle>
              <CardDescription className="text-gray-300 mt-1">
                {organization.description || "Educational organization"}
              </CardDescription>
            </div>
          </div>
          
          {!isUserMember ? (
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all shadow-md hover:shadow-lg"
              onClick={() => handleJoinOrg(organization.organizationId)}
            >
              Join
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
              <BadgeCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Member</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap mt-4 gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm">{totalMembers} Members</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span className="text-sm">{courses.length} Courses</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="bg-gray-700/50 p-1">
            <TabsTrigger value="courses" className="data-[state=active]:bg-blue-500">Courses</TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-blue-500">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="mt-6">
            {isLoading ? (
              <Loading />
            ) : isError ? (
              <div className="p-8 text-center rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400">Failed to load courses. Please try again later.</p>
              </div>
            ) : courses?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course: Course) => (
                  <CourseCard key={course.courseId} course={course} onGoToCourse={() => {}} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-lg bg-gray-700/20 border border-gray-700">
                <BookOpen className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                <p className="text-gray-400">No courses available for this organization yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-3">About {organization.name}</h3>
              <p className="text-gray-300 mb-4">{organization.description || "This organization is dedicated to providing quality education and learning resources."}</p>
              
              <h4 className="text-lg font-medium text-white mt-6 mb-2">Leadership</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {organization.admins?.length > 0 ? (
                  organization.admins.slice(0, 3).map(({ userId: adminId }, index) => (
                    <div key={adminId} className="flex items-center gap-3 bg-gray-700/30 p-3 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-600/30 text-blue-200">
                          {`A${index + 1}`}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">Admin {index + 1}</p>
                        <p className="text-xs text-gray-400">Organization Leader</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm col-span-full">Admin information not available</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}