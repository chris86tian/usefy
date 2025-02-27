"use client"

import { SignedIn, useUser } from "@clerk/nextjs"
import { School, ChevronRight, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { useGetMyOrganizationsQuery } from "@/state/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Loading from "./Loading"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function OrganizationsDropdown() {
  const { data: organizations, isLoading } = useGetMyOrganizationsQuery()
  const router = useRouter()
  const { user } = useUser()

  console.log("organizations", organizations)

  const handleOrganizationClick = (orgId: string) => {
    router.push(`/organizations/${orgId}`, { scroll: false })
  }

  if (!organizations) return null

  return (
    <SignedIn>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-customgreys-dirtyGrey flex items-center gap-1">
            <span>My Organizations</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] bg-gray-900 border-gray-800">
          <DropdownMenuLabel className="text-lg font-bold text-white">Your Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-800" />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : organizations?.length > 0 ? (
            <>
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.organizationId}
                  onClick={() => handleOrganizationClick(org.organizationId)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-blue-600">
                      <AvatarFallback className="bg-blue-600/80 text-white">
                        {org.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-white">{org.name}</h3>
                      <p className="text-sm text-gray-400">
                        {org.admins.some((admin) => admin.userId === user?.id)
                          ? "Admin"
                          : org.instructors.some((instructor) => instructor.userId === user?.id)
                            ? "Instructor"
                            : "Learner"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <div className="text-center py-6 px-4">
              <School className="mx-auto h-12 w-12 text-gray-500 mb-3" />
              <p className="text-gray-300 mb-4">You aren&apos;t a member of any organizations yet.</p>
            </div>
          )}

          <DropdownMenuSeparator className="bg-gray-800" />
          <DropdownMenuItem
            onClick={() => {
              router.push("/organizations/create", { scroll: false })
            }}
            className="p-0 focus:bg-transparent"
          >
            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus size={16} />
              Create New Organization
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SignedIn>
  )
}

