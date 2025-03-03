'use client'

import React from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import AdminCohortPage from "./_components/AdminCohort";
import UserCohortPage from "./_components/UserCohort";

const CohortPage = () => {
    const { orgId, cohortId } = useParams();
    const { user } = useUser()
    const { currentOrg } = useOrganization()
    const isAdmin = currentOrg?.admins.some((admin) => admin.userId === user?.id)
    return (
        <>
            {isAdmin ? <AdminCohortPage /> : <UserCohortPage />}
        </>
    )
};

export default CohortPage;