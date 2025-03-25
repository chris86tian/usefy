'use client'

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import AdminCohort from "./_components/(admin)/AdminCohort";
import UserCohort from "./_components/(user)/UserCohort";
import { useParams } from "next/navigation";
import NotFound from "@/components/NotFound";
import { Spinner } from "@/components/ui/Spinner";
import { SignInRequired } from "@/components/SignInRequired";
import { 
    useGetOrganizationUsersQuery,
    useGetCohortCoursesQuery
} from "@/state/api";

export default function CohortPage() {
    const { user } = useUser()
    const { orgId, cohortId } = useParams() as { orgId: string, cohortId: string }
    const { currentOrg, isOrgLoading } = useOrganization()
    
    const { data: orgUsers, isLoading: usersLoading } = useGetOrganizationUsersQuery({ organizationId: orgId })
    const { data: cohortCourses, isLoading: coursesLoading, refetch } = useGetCohortCoursesQuery({ organizationId: orgId, cohortId })

    if (isOrgLoading || usersLoading || coursesLoading) return <Spinner />
    if (!user) return <SignInRequired />
    if (!currentOrg || !orgUsers || !cohortCourses) return <NotFound message={!currentOrg ? "Organization not found" : "Cohort not found"} />

    const isAdmin = currentOrg.admins.some((admin) => admin.userId === user.id)

    return (
        <>
            {isAdmin ? 
                <AdminCohort 
                    orgUsers={orgUsers}
                    courses={cohortCourses}
                    usersLoading={usersLoading}
                    coursesLoading={coursesLoading}
                    refetch={refetch}
                /> : 
                <UserCohort
                    orgUsers={orgUsers}
                    courses={cohortCourses}
                    coursesLoading={coursesLoading}
                    refetch={refetch}
                />
            }
        </>
    )
};