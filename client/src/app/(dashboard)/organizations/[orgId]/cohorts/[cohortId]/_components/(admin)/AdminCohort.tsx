"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/Spinner"
import { BookOpen, Users } from 'lucide-react'
import { useParams } from "next/navigation"
import { useGetCohortQuery } from "@/state/api"
import Header from "@/components/Header"
import CohortMembers from "./CohortMembers"
import CohortCourses from "./CohortCourses"
import type { User } from "@clerk/nextjs/server"
import NotFound from "@/components/NotFound"
import { useUser } from "@clerk/nextjs"
import { SignInRequired } from "@/components/SignInRequired"

interface AdminCohortProps {
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  usersLoading: boolean
  coursesLoading: boolean
  courses: Course[]
  refetch: () => void
}

const AdminCohort = ({ orgUsers, usersLoading, coursesLoading, courses, refetch }: AdminCohortProps) => {
  const { user } = useUser()
  const { orgId, cohortId } = useParams() as { orgId: string; cohortId: string }

  const { 
    data: cohort, 
    isLoading: cohortLoading, 
  } = useGetCohortQuery({ organizationId: orgId, cohortId, })

  if (cohortLoading || usersLoading || coursesLoading) return <Spinner />
  if (!cohort) return <NotFound message="Cohort not found" />
  if (!user) return <SignInRequired />

  return (
    <div className="space-y-2">
      <Header title={cohort.name} subtitle="Manage cohort learners and courses" />

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <CohortCourses
            cohort={cohort} 
            orgUsers={orgUsers} 
            courses={courses} 
            refetch={refetch}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <CohortMembers 
            cohort={cohort} 
            orgUsers={orgUsers} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminCohort
