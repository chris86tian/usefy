"use client"

import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, Settings, Home, Users, Plus, ChevronDown, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CollapsibleSidebar, SidebarItem, SidebarSection } from "@/components/CollapsibleSidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { useUser } from "@clerk/nextjs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCreateCohortMutation } from "@/state/api"
import Image from "next/image"

interface OrganizationSidebarProps {
  organizations: Organization[]
  cohorts: Cohort[]
  currentOrg: Organization
  isUserAdmin: boolean
  orgId: string
  refetchCohorts: () => void
}

export default function OrganizationSidebar({
  organizations,
  cohorts,
  currentOrg,
  isUserAdmin,
  orgId,
  refetchCohorts,
}: OrganizationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [isCreateCohortModalOpen, setIsCreateCohortModalOpen] = useState(false)
  const [cohortName, setCohortName] = useState("")

  const [createCohort, { isLoading: isCreateCohortLoading }] = useCreateCohortMutation()
  

  const baseNavItems = [
    {
      label: "Dashboard",
      href: `/organizations/${orgId}`,
      icon: Home,
      active: pathname === `/organizations/${orgId}`,
    },
  ]

  const adminNavItems = [
    {
      label: "Courses",
      href: `/organizations/${orgId}/courses`,
      icon: BookOpen,
      active: pathname.includes(`/organizations/${orgId}/courses`),
    },
    {
      label: "Settings",
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

  const handleCreateCohort = async () => {
    if (!cohortName.trim()) {
      toast.error("Please enter a cohort name")
      return
    }

    try {
      await createCohort({
        organizationId: orgId,
        cohortId: uuidv4(),
        name: cohortName.trim(),
      })
      toast.success("Cohort created successfully")
      setIsCreateCohortModalOpen(false)
      setCohortName("")
      refetchCohorts()
    } catch (error) {
      toast.error("Failed to create cohort")
    }
  }

  const canAccessCohort = (cohort: Cohort) => {
    if (isUserAdmin) return true
    if (!user) return false
    return cohort.learners?.some((learner) => learner.userId === user.id)
  }

  const handleCohortClick = (cohort: Cohort) => {
    if (canAccessCohort(cohort)) {
      router.push(`/organizations/${orgId}/cohorts/${cohort.cohortId}`)
    } else {
      toast.error("You don't have access to this cohort")
    }
  }

  return (
    <CollapsibleSidebar
      defaultCollapsed={false}
      width="16rem"
      collapsedWidth="4.5rem"
      className="border-r border-border"
      onCollapseChange={setCollapsed}
    >
      <div className={cn("p-4 border-b", collapsed ? "flex justify-center" : "")}>
        {currentOrg && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center rounded-md hover:bg-accent transition-colors",
                collapsed ? "justify-center w-10 h-10 p-0" : "justify-between w-full px-2",
              )}
            >
              <div className={cn("flex items-center", collapsed ? "gap-0" : "gap-2")}>
                <Avatar className="h-8 w-8">
                  {currentOrg.image ? (
                    <Image src={currentOrg.image} alt={currentOrg.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {currentOrg.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {!collapsed && <span className="font-medium truncate max-w-[120px]">{currentOrg.name}</span>}
              </div>
              {!collapsed && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
                          .map((n: string) => n[0])
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

      <div className="p-3">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            active={item.active}
            onClick={() => router.push(item.href)}
            collapsed={collapsed}
          />
        ))}
      </div>

      <SidebarSection title="Cohorts" collapsed={collapsed}>
        {collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10 rounded-md transition-colors my-1",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Users className="h-5 w-5" />
                <span className="sr-only">Cohorts</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>Cohorts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[var(--radix-dropdown-menu-content-available-height)] max-h-60">
                {cohorts && cohorts.length > 0 ? (
                  cohorts.map((cohort) => {
                    const hasAccess = canAccessCohort(cohort)

                    return (
                      <TooltipProvider key={cohort.cohortId}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm",
                                hasAccess ? "cursor-pointer hover:bg-accent" : "cursor-not-allowed opacity-60",
                                pathname.includes(`/organizations/${orgId}/cohorts/${cohort.cohortId}`) &&
                                  hasAccess &&
                                  "bg-accent",
                              )}
                              onClick={hasAccess ? () => handleCohortClick(cohort) : undefined}
                            >
                              {!hasAccess && <Lock className="h-3.5 w-3.5 flex-shrink-0" />}
                              <span className="truncate">{cohort.name}</span>
                            </div>
                          </TooltipTrigger>
                          {!hasAccess && (
                            <TooltipContent side="right">
                              <p>You don&apos;t have access to this cohort</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No cohorts available</div>
                )}
              </ScrollArea>
              {isUserAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <Dialog open={isCreateCohortModalOpen} onOpenChange={setIsCreateCohortModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mx-2 my-1">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Cohort
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Cohort</DialogTitle>
                        <DialogDescription>
                          Enter the name for your new cohort. Click save when you&apos;re done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="cohortName" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="cohortName"
                            value={cohortName}
                            onChange={(e) => setCohortName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleCreateCohort} disabled={isCreateCohortLoading}>
                          {isCreateCohortLoading ? "Creating..." : "Create Cohort"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            {cohorts?.map((cohort) => {
              const hasAccess = canAccessCohort(cohort)

              return (
                <TooltipProvider key={cohort.cohortId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        disabled={!hasAccess}
                        onClick={() => hasAccess && handleCohortClick(cohort)}
                        className={cn(
                          "w-full justify-start text-sm h-9 px-2 mb-1",
                          pathname.includes(`/organizations/${orgId}/cohorts/${cohort.cohortId}`) && hasAccess
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          !hasAccess && "opacity-60 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {!hasAccess && <Lock className="h-4 w-4 flex-shrink-0" />}
                          <span className="truncate">{cohort.name}</span>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    {!hasAccess && (
                      <TooltipContent>
                        <p>You don&apos;t have access to this cohort</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )
            })}

            {isUserAdmin && (
              <Dialog open={isCreateCohortModalOpen} onOpenChange={setIsCreateCohortModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Cohort
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Cohort</DialogTitle>
                    <DialogDescription>
                      Enter the name for your new cohort. Click save when you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cohortName" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="cohortName"
                        value={cohortName}
                        onChange={(e) => setCohortName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreateCohort}>
                      Create Cohort
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </SidebarSection>
    </CollapsibleSidebar>
  )
}

