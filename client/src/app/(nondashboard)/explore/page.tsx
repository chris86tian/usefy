"use client"
import Loading from "@/components/Loading"
import { useGetOrganizationsQuery, useJoinOrganizationMutation } from "@/state/api"
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
  const [joinOrganization] = useJoinOrganizationMutation()
  const [selectedOrg, setSelectedOrg] = useState<Organization>()
  const router = useRouter()
  const user = useUser()

  console.log("organizations", organizations)

  useEffect(() => {
    if (!organizations || organizations.length === 0) return
    if (id) {
      const org = organizations.find((o) => o.organizationId === id)
      setSelectedOrg(org || organizations[0])
    } else {
      setSelectedOrg(organizations[0])
    }
  }, [organizations, id])

  if (isLoading) return <Loading />
  if (isError || !organizations) return <div>Failed to fetch organizations</div>

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org)
    router.push(`/explore?id=${org.organizationId}`, { scroll: false, })
  }

  const handleJoinOrg = async (orgId: string) => {
    if (!user.isSignedIn) {
      router.push("/signin")
      return
    }
    await joinOrganization(orgId).unwrap()
    refetch()
  }

  const handleOrganizationCreated = () => {
    refetch()
  }

  return (
    <motion.div 
      key="main-container" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }} 
      className="container mx-auto px-4 py-8"
    >
      <div>
        <h1 className="search__title">Explore Organizations</h1>
        <h2 className="search__subtitle">{organizations.length} organizations available</h2>
      </div>
      <CreateOrganizationModal onOrganizationCreated={handleOrganizationCreated} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          key="org-list-container" 
          initial={{ y: 40, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }} 
          className="lg:col-span-1 space-y-4"
        >
          {organizations.map((org: Organization) => (
            <OrganizationCard 
              key={org.organizationId} 
              organization={org} 
              isSelected={selectedOrg?.organizationId === org.organizationId} 
              onClick={() => handleOrgSelect(org)} 
            />
          ))}
        </motion.div>
        {selectedOrg && (
          <motion.div 
            key="selected-org-container" 
            initial={{ y: 40, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.5 }} 
            className="lg:col-span-2"
          >
            <SelectedOrganization 
              organization={selectedOrg} 
              handleJoinOrg={handleJoinOrg} 
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}