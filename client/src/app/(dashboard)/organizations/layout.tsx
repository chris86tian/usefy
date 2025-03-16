"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetMyOrganizationsQuery, useGetCohortsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { Spinner } from "@/components/ui/Spinner"
import { OrganizationContext } from "@/context/OrganizationContext"
import OrganizationSidebar from "@/components/OrganizationsSidebar"

interface OrganizationLayoutProps {
  children: React.ReactNode
}

export default function OrganizationLayout({ children }: OrganizationLayoutProps) {
  const router = useRouter()
  const { orgId } = useParams()
  const { user } = useUser()

  const { data: organizations, isLoading } = useGetMyOrganizationsQuery()
  const { data: cohorts, refetch } = useGetCohortsQuery(orgId as string)

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

  const isUserAdmin = currentOrg?.admins?.some((admin: { userId: string }) => admin.userId === user?.id)

  if (isLoading) return <Spinner />

  return (
    <OrganizationContext.Provider value={{ currentOrg }}>
      <div className="flex h-screen w-full">
        <OrganizationSidebar
          organizations={organizations || []}
          cohorts={cohorts || []}
          currentOrg={currentOrg as Organization}
          isUserAdmin={!!isUserAdmin}
          orgId={orgId as string}
          refetchCohorts={refetch}
        />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </OrganizationContext.Provider>
  )
}

