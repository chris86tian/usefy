'use client';

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetMyOrganizationsQuery, useGetCohortsQuery } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/Spinner";
import { OrganizationContext } from "@/context/OrganizationContext";
import OrganizationSidebar from "@/components/OrganizationsSidebar";
import NotFound from "@/components/NotFound";
import { SignInRequired } from "@/components/SignInRequired";

interface OrganizationLayoutProps {
  children: React.ReactNode;
}

export default function OrganizationLayout({ children }: OrganizationLayoutProps) {
  const { orgId } = useParams() as { orgId: string };
  const { user } = useUser();

  const { data: organizations, isLoading: orgsLoading } = useGetMyOrganizationsQuery();
  const { data: cohorts, isLoading: cohortsLoading, refetch } = useGetCohortsQuery(orgId);

  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  useEffect(() => {
    if (!organizations || !orgId) return;

    const org = organizations.find((org) => org.organizationId === orgId);
    if (org) {
      setCurrentOrg(org);
      setIsOrgLoading(false);
    } else if (organizations.length > 0) {
      setCurrentOrg(organizations[0]);
      setIsOrgLoading(false);
    } else {
      setIsOrgLoading(false);
    }
  }, [organizations, orgId]);

  if (orgsLoading || cohortsLoading || isOrgLoading) return <Spinner />;
  if (!user) return <SignInRequired />;
  if (!currentOrg || !cohorts || !organizations) 
    return <NotFound message={!currentOrg ? "Organization not found" : !cohorts ? "Cohorts not found" : "Organizations not found"} />;
  
  const isAuthorized = currentOrg.admins.some((admin) => admin.userId === user.id);

  return (
    <OrganizationContext.Provider value={{ currentOrg, isOrgLoading }}>
      <div className="flex h-screen">
        <OrganizationSidebar
          organizations={organizations}
          cohorts={cohorts}
          currentOrg={currentOrg}
          isAuthorized={!!isAuthorized}
          orgId={orgId}
          refetchCohorts={refetch}
        />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </OrganizationContext.Provider>
  );
}
