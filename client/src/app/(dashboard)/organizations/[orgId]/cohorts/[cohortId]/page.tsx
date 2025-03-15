'use client'

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import AdminCohort from "./_components/(admin)/AdminCohort";
import UserCohort from "./_components/(user)/UserCohort";
import { useParams } from "next/navigation";
import NotFound from "@/components/NotFound";
import { 
    useGetOrganizationUsersQuery,
    useGetCohortCoursesQuery
} from "@/state/api";
import { Spinner } from "@/components/ui/Spinner";

export default function CohortPage() {
    const { user } = useUser()
    const { orgId, cohortId } = useParams()
    const { currentOrg } = useOrganization()
    const { data: orgUsers, isLoading: usersLoading } = useGetOrganizationUsersQuery(orgId as string)
    const { data: cohortCourses, isLoading: coursesLoading, refetch } = useGetCohortCoursesQuery({ organizationId: orgId as string, cohortId: cohortId as string })

    const isAdmin = currentOrg?.admins.some((admin) => admin.userId === user?.id)

    if (usersLoading || coursesLoading) return <Spinner />
    if (!orgUsers || !cohortCourses) return <NotFound message={!orgUsers ? "Organization not found" : "Cohort not found"} />

    return (
        <>
            {isAdmin ? 
                <AdminCohort 
                    orgUsers={orgUsers}
                    usersLoading={usersLoading}
                    coursesLoading={coursesLoading}
                    courses={cohortCourses}
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