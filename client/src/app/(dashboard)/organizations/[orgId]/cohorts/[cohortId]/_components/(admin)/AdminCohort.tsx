"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/Spinner"
import { BookOpen, Users } from 'lucide-react'
import { useParams } from "next/navigation"
import { useGetCohortQuery } from "@/state/api"
import Header from "@/components/Header"
import CohortMembersTab from "./CohortMembers"
import CohortCoursesTab from "./CohortCourses"
import type { User } from "@clerk/nextjs/server"

interface AdminCohortPageProps {
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  usersLoading: boolean
  courses: Course[]
}

const AdminCohortPage = ({ orgUsers, usersLoading, courses }: AdminCohortPageProps) => {
  const { orgId, cohortId } = useParams()
  const { data: cohort, isLoading: cohortLoading, refetch } = useGetCohortQuery(
    { organizationId: orgId as string, cohortId: cohortId as string },
    { skip: !orgId || !cohortId },
  )

  if (cohortLoading || usersLoading) {
    return <Spinner />
  }

  if (!cohort) {
    return <div>Cohort not found</div>
  }

  return (
    <div className="space-y-6">
      <Header title={cohort.name} subtitle="Manage cohort learners and courses" />

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <CohortMembersTab 
            cohort={cohort} 
            orgUsers={orgUsers} 
            refetch={refetch} 
          />
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <CohortCoursesTab 
            cohort={cohort} 
            orgUsers={orgUsers} 
            courses={courses as Course[]} 
            refetch={refetch} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminCohortPage
