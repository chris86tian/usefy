"use client"

import Loading from "@/components/Loading"
import { useGetOrganizationsQuery } from "@/state/api"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import { OrganizationCard } from "@/components/OrganizationCard"
import { SelectedOrganization } from "./_components/SelectedOrganization"
import { CreateOrganizationModal } from "./_components/CreateOrganizationModal"

export default function Explore() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const { data: organizations, isLoading, isError, refetch } = useGetOrganizationsQuery()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const router = useRouter()
  const user = useUser()

  useEffect(() => {
    if (!organizations || organizations.length === 0) return
  
    if (id) {
      const org = organizations.find((o) => o.id === id)
      setSelectedOrg(org || organizations[0])
    } else {
      setSelectedOrg(organizations[0])
    }
  }, [organizations, id])  

  if (isLoading) return <Loading />
  if (isError || !organizations) return <div>Failed to fetch organizations</div>

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org)
  }

  const handleJoinOrg = (orgId: string) => {
    router.push(`/organizations/${orgId}/join`, {
      scroll: false,
    })
  }

  const handleOrganizationCreated = () => {
    refetch()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Organizations</h1>
          <h2 className="text-xl text-muted-foreground">{organizations.length} organizations available</h2>
        </div>
        <CreateOrganizationModal onOrganizationCreated={handleOrganizationCreated} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1 space-y-4"
        >
          {organizations.map((org: Organization) => (
            <div key={org.id} onClick={() => handleOrgSelect(org)} className="cursor-pointer transition-all">
              <OrganizationCard organization={org} isSelected={selectedOrg?.id === org.id} />
            </div>
          ))}
        </motion.div>

        {selectedOrg && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <SelectedOrganization
              organization={selectedOrg}
              handleJoinOrg={handleJoinOrg}
              userId={user.user?.id || ""}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

