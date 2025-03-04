'use client'

import React from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import AdminCohortPage from "./_components/AdminCohort";
import UserCohortPage from "./_components/UserCohort";
import { useGetCohortQuery, useGetOrganizationUsersQuery } from "@/state/api";

const CohortPage = () => {
    const { orgId, cohortId } = useParams();
    const { data: cohort, isLoading: cohortLoading, refetch } = useGetCohortQuery({ organizationId: orgId as string, cohortId: cohortId as string })
    const { data: orgUsers, isLoading: usersLoading } = useGetOrganizationUsersQuery(orgId as string)
    const { user } = useUser()
    const { currentOrg } = useOrganization()
    const isAuthorized = currentOrg?.admins.some((admin) => admin.userId === user?.id) || currentOrg?.instructors.some((instructor) => instructor.userId === user?.id)
    return (
        <>
            {isAuthorized ? 
                <AdminCohortPage 
                    cohort={cohort} 
                    cohortLoading={cohortLoading}
                    orgUsers={orgUsers as any}
                    usersLoading={usersLoading}
                    refetch={refetch}
                /> : 
                <UserCohortPage 
                    cohort={cohort} 
                    cohortLoading={cohortLoading}
                    orgUsers={orgUsers as any}
                    usersLoading={usersLoading}
                    refetch={refetch}
                />
            }
        </>
    )
};

export default CohortPage;