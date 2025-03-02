"use client";

import {
  useGetOrganizationsQuery,
  useJoinOrganizationMutation,
} from "@/state/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { OrganizationCard } from "@/components/OrganizationCard";
import { SelectedOrganization } from "./_components/SelectedOrganization";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function Explore() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const {
    data: organizations,
    isLoading,
    isError,
  } = useGetOrganizationsQuery();
  const [joinOrganization] = useJoinOrganizationMutation();
  const [selectedOrg, setSelectedOrg] = useState<Organization>();
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (!organizations || organizations.length === 0) return;
    if (id) {
      const org = organizations.find((o) => o.organizationId === id);
      setSelectedOrg(org || organizations[0]);
    } else {
      setSelectedOrg(organizations[0]);
    }
  }, [organizations, id]);

  if (isLoading) return <Spinner />;

  if (isError || !organizations) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to fetch organizations. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org);
    router.push(`/explore?id=${org.organizationId}`, { scroll: false });
  };

  const handleJoinOrg = async (orgId: string) => {
    if (!user.isSignedIn) {
      router.push("/signin");
      return;
    }
    await joinOrganization(orgId).unwrap();
    router.push(`/organizations/${orgId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 transition-opacity duration-300 ease-in-out">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Explore Organizations
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {organizations.length} organizations available
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4 transition-all duration-300 ease-in-out">
          {organizations.map((org: Organization) => (
            <OrganizationCard
              key={org.organizationId}
              organization={org}
              isSelected={selectedOrg?.organizationId === org.organizationId}
              onClick={() => handleOrgSelect(org)}
            />
          ))}
        </div>

        {selectedOrg && (
          <div className="lg:col-span-2 transition-all duration-300 ease-in-out">
            <SelectedOrganization
              organization={selectedOrg}
              handleJoinOrg={handleJoinOrg}
            />
          </div>
        )}
      </div>
    </div>
  );
}
