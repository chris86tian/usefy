"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useGetMyOrganizationsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, BookOpen, BarChart, Settings, Home, DollarSign, User } from "lucide-react"
import { Spinner } from "@/components/ui/Spinner"
import { OrganizationContext } from "@/context/OrganizationContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OrganizationLayoutProps {
  children: React.ReactNode
}

export default function OrganizationLayout({ children }: OrganizationLayoutProps) {
  const { orgId } = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { data: organizations, isLoading } = useGetMyOrganizationsQuery()
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

  const isUserAdmin = currentOrg?.admins?.some((admin) => admin.userId === user?.id)

  const baseNavItems = [
    {
      label: "Dashboard",
      href: `/organizations/${orgId}`,
      icon: Home,
      active: pathname === `/organizations/${orgId}`,
    },
    {
      label: "Courses",
      href: `/organizations/${orgId}/courses`,
      icon: BookOpen,
      active: pathname.includes(`/organizations/${orgId}/courses`),
    },
    {
      label: "Profile",
      href: `/organizations/${orgId}/profile`,
      icon: User,
      active: pathname.includes(`/organizations/${orgId}/profile`),
    },
    {
      label: "Payments",
      href: `/organizations/${orgId}/payments`,
      icon: DollarSign,
      active: pathname.includes(`/organizations/${orgId}/payments`),
    },
  ]

  const adminNavItems = [
    {
      label: "Analytics",
      href: `/organizations/${orgId}/analytics`,
      icon: BarChart,
      active: pathname.includes(`/organizations/${orgId}/analytics`),
    },
    {
      label: "Group Settings",
      href: `/organizations/${orgId}/settings`,
      icon: Settings,
      active: pathname.includes(`/organizations/${orgId}/settings`),
    },
  ]

  const navItems = isUserAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems

  const handleOrgChange = (newOrgId: string) => {
    if (newOrgId !== orgId) {
      const currentPath = pathname.split("/")
      const currentSubPath = currentPath.length > 3 ? currentPath.slice(3).join("/") : ""

      const newPath = currentSubPath ? `/organizations/${newOrgId}/${currentSubPath}` : `/organizations/${newOrgId}`

      router.push(newPath)
    }
  }

  if (isLoading) return <Spinner />

  return (
    <SidebarProvider>
      <OrganizationContext.Provider value={{ currentOrg }}>
        <div className="flex h-screen w-full bg-background">
          <Sidebar className="w-64 flex-shrink-0 border-r border-border">
            <div className="px-4 py-4 border-b">
              {currentOrg && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-accent transition-colors">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {currentOrg.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate max-w-[120px]">{currentOrg.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-[240px]">
                    <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-[var(--radix-dropdown-menu-content-available-height)] max-h-40">
                      {organizations?.map((org) => (
                        <DropdownMenuItem
                          key={org.organizationId}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 cursor-pointer",
                            org.organizationId === orgId && "bg-accent",
                          )}
                          onClick={() => handleOrgChange(org.organizationId)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {org.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{org.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-5rem)]">
              <nav className="space-y-1 p-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors",
                        item.active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </ScrollArea>
          </Sidebar>

          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-4">{children}</main>
          </div>
        </div>
      </OrganizationContext.Provider>
    </SidebarProvider>
  )
}

