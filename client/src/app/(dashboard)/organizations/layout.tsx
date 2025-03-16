"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetMyOrganizationsQuery, useGetCohortsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { Spinner } from "@/components/ui/Spinner"
import { OrganizationContext } from "@/context/OrganizationContext"
import OrganizationSidebar from "@/components/OrganizationsSidebar"
import NotFound from "@/components/NotFound"
import { SignInRequired } from "@/components/SignInRequired"

interface OrganizationLayoutProps {
  children: React.ReactNode
}

export default function OrganizationLayout({ children }: OrganizationLayoutProps) {
  const router = useRouter()
  const { orgId } = useParams() as { orgId: string }
  const { user } = useUser()

  const { data: organizations, isLoading } = useGetMyOrganizationsQuery()
  const { data: cohorts, refetch } = useGetCohortsQuery(orgId)

  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)

  useEffect(() => {
    if (organizations && orgId) {
      const org = organizations.find((org) => org.organizationId === orgId)
      if (org) {
        setCurrentOrg(org)
      } else if (organizations.length > 0) {
        router.push(`/organizations/${organizations[0].organizationId}`)
      }
    }
  }, [organizations, orgId, router])

  if (isLoading) return <Spinner />
  if (!user) return <SignInRequired />
  if (!currentOrg || !cohorts || !organizations) return <NotFound message={!currentOrg ? "Organization not found" : "Cohorts not found"} />
  
  const isAuthorized = currentOrg.admins.some((admin) => admin.userId === user.id)

  return (
    <OrganizationContext.Provider value={{ currentOrg }}>
      <div className="flex h-screen w-full">
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
  )
}

