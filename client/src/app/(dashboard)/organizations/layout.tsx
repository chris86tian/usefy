"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useGetMyOrganizationsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { Sidebar } from "@/components/ui/sidebar" // Adjust import path to your shadcn sidebar component
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Users, BookOpen, BarChart, Settings, Home } from "lucide-react"
import Loading from "@/components/Loading" // Adjust path to your loading component

interface OrganizationLayoutProps {
  children: React.ReactNode
}

export default function OrganizationLayout({ children }: OrganizationLayoutProps) {
  const { orgId } = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { data: organizations, isLoading } = useGetMyOrganizationsQuery()
  const [currentOrg, setCurrentOrg] = useState<any>(null)

  useEffect(() => {
    if (organizations && orgId) {
      const org = organizations.find((org) => org.organizationId === orgId)
      if (org) {
        setCurrentOrg(org)
      } else if (organizations.length > 0) {
        // Redirect to first organization if current ID not found
        router.push(`/organizations/${organizations[0].organizationId}`)
      }
    }
  }, [organizations, orgId, router])
  
  const isUserAdmin = currentOrg?.admins?.some((admin: any) => admin.userId === user?.id)
  const isUserInstructor = currentOrg?.instructors?.some((instructor: any) => instructor.userId === user?.id)
  
  // Navigation items based on user role
  const navItems = [
    { 
      label: "Dashboard", 
      href: `/organizations/${orgId}`, 
      icon: Home,
      active: pathname === `/organizations/${orgId}`
    },
    { 
      label: "Courses", 
      href: `/organizations/${orgId}/courses`, 
      icon: BookOpen,
      active: pathname.includes(`/organizations/${orgId}/courses`)
    },
    { 
      label: "Members", 
      href: `/organizations/${orgId}/members`, 
      icon: Users,
      active: pathname.includes(`/organizations/${orgId}/members`)
    },
    ...(isUserAdmin || isUserInstructor ? [
      { 
        label: "Analytics", 
        href: `/organizations/${orgId}/analytics`, 
        icon: BarChart,
        active: pathname.includes(`/organizations/${orgId}/analytics`)
      }
    ] : []),
    ...(isUserAdmin ? [
      { 
        label: "Settings", 
        href: `/organizations/${orgId}/settings`, 
        icon: Settings,
        active: pathname.includes(`/organizations/${orgId}/settings`)
      }
    ] : [])
  ]

  const handleOrgChange = (newOrgId: string) => {
    if (newOrgId !== orgId) {
      // Keep the same subpath when switching organizations when possible
      const currentPath = pathname.split('/')
      const currentSubPath = currentPath.length > 3 ? currentPath.slice(3).join('/') : ''
      
      // Navigate to the same section in the new organization if it exists
      const newPath = currentSubPath 
        ? `/organizations/${newOrgId}/${currentSubPath}` 
        : `/organizations/${newOrgId}`
      
      router.push(newPath)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!organizations || organizations.length === 0) {
    // Handle case where user has no organizations
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">No Organizations Found</h1>
        <p className="text-gray-500">You are not a member of any organizations.</p>
        <button 
          onClick={() => router.push('/explore')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Explore Organizations
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0 border-r border-gray-800">
        {/* Organization Selector */}
        <div className="px-4 py-4 border-b border-gray-800">
          {currentOrg && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-gray-800/50 transition">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 bg-blue-600">
                    <AvatarFallback className="bg-blue-600/80 text-white">
                      {currentOrg.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-[120px]">{currentOrg.name}</span>
                </div>
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-[240px] bg-gray-900 border-gray-800">
                <DropdownMenuLabel className="text-white">Switch Organization</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                {organizations.map((org) => (
                  <DropdownMenuItem 
                    key={org.organizationId}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-800 ${
                      org.organizationId === orgId ? 'bg-gray-800/60' : ''
                    }`}
                    onClick={() => handleOrgChange(org.organizationId)}
                  >
                    <Avatar className="h-6 w-6 bg-blue-600">
                      <AvatarFallback className="bg-blue-600/80 text-white text-xs">
                        {org.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{org.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Navigation Items */}
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition ${
                  item.active 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div>
          {children}
        </div>
      </main>
    </div>
  )
}