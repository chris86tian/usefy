'use client'

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import AdminCohortPage from "./_components/(admin)/AdminCohort";
import { 
    useGetOrganizationUsersQuery,
    useGetCohortCoursesQuery
} from "@/state/api";
import { useParams } from "next/navigation";
import UserCourses from "../../courses/_components/UserCourses";

export default function CohortPage() {
    const { user } = useUser()
    const { orgId, cohortId } = useParams()
    const { currentOrg } = useOrganization()
    const { data: orgUsers, isLoading: usersLoading } = useGetOrganizationUsersQuery(orgId as string)
    const { data: cohortCourses, refetch } = useGetCohortCoursesQuery({ organizationId: orgId as string, cohortId: cohortId as string })

    const isAdmin= currentOrg?.admins.some((admin) => admin.userId === user?.id)

    return (
        <>
            {isAdmin ? 
                <AdminCohortPage 
                    orgUsers={orgUsers as any}
                    usersLoading={usersLoading}
                    courses={cohortCourses as Course[]}
                /> : 
                <UserCourses
                    courses={cohortCourses as Course[]}
                    refetch={refetch}
                />
            }
        </>
    )
};