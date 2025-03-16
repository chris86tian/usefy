"use client"

import { useOrganization } from "@/context/OrganizationContext"
import { useUser } from "@clerk/nextjs"
import { SignInRequired } from "@/components/SignInRequired"
import Header from "@/components/Header"
import AdminDashboard from "./_components/AdminDashboard"
import UserDashboard from "./_components/UserDashboard"
import NotFound from "@/components/NotFound"
import { Spinner } from "@/components/ui/Spinner"

export default function OrganizationDashboard() {
  const { currentOrg, isOrgLoading } = useOrganization()
  const { user } = useUser()

  if (isOrgLoading) return <Spinner />
  if (!user) return <SignInRequired />
  if (!currentOrg) return <NotFound message="Organization not found" />

  const isAdmin = currentOrg.admins.some((admin) => admin.userId === user.id)
  
  return (
    <>
      <Header 
        title={isAdmin ? "Admin Dashboard" : "User Dashboard"}
        subtitle={"Manage your organization"}
      />
      {isAdmin ? <AdminDashboard orgId={currentOrg.organizationId}/> : <UserDashboard orgId={currentOrg.organizationId} />}
    </>
  )
}