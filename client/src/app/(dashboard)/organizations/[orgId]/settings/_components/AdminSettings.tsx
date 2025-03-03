"use client"

import type React from "react"
import { useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useOrganization } from "@/context/OrganizationContext"
import { toast } from "sonner"
import {
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useInviteUserToOrganizationMutation,
  useGetOrganizationUsersQuery,
  useRemoveUserFromOrganizationMutation,
  useChangeUserRoleMutation,
} from "@/state/api"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/Header"
import { Users, Settings, Shield, Search } from "lucide-react"
import type { User } from "@clerk/nextjs/server"

const AdminSettings = () => {
  const router = useRouter()
  const { currentOrg } = useOrganization()
  const [updateOrganization] = useUpdateOrganizationMutation()
  const [deleteOrganization] = useDeleteOrganizationMutation()
  const [inviteUser] = useInviteUserToOrganizationMutation()
  const { data: members, refetch } = useGetOrganizationUsersQuery(currentOrg?.organizationId || "")
  const [removeUser] = useRemoveUserFromOrganizationMutation()
  const [changeUserRole] = useChangeUserRoleMutation()

  const [orgName, setOrgName] = useState(currentOrg?.name || "")
  const [orgDescription, setOrgDescription] = useState(currentOrg?.description || "")
  const [orgImage, setOrgImage] = useState<File | null>(null)
  const [orgImagePreview, setOrgImagePreview] = useState(currentOrg?.image || "")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "instructor" | "learner">("learner")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "instructor" | "learner">("all")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOrgImage(file)
      setOrgImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    try {
      const formData = new FormData()
      formData.append("name", orgName)
      formData.append("description", orgDescription)
      if (orgImage) {
        formData.append("image", orgImage)
      }

      await updateOrganization({
        organizationId: currentOrg?.organizationId || "",
        formData: formData,
      }).unwrap()
      toast.success("Organization updated successfully")
    } catch (error) {
      toast.error("Failed to update organization")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOrganization(currentOrg?.organizationId || "").unwrap()
      toast.success("Organization deleted successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to delete organization")
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) {
      toast.error("Please enter an email address")
      return
    }

    try {
      await inviteUser({
        organizationId: currentOrg?.organizationId || "",
        email: inviteEmail,
        role: inviteRole,
      }).unwrap()
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
      refetch()
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

  const handleRemoveUser = async (userId: string, role: string) => {
    try {
      await removeUser({
        organizationId: currentOrg?.organizationId || "",
        userId,
        role,
      }).unwrap()
      refetch()
      toast.success("User removed successfully")
    } catch (error) {
      toast.error("Failed to remove user")
    }
  }

  const handleChangeRole = async (userId: string, currentRole: string, newRole: string) => {
    try {
      if (currentRole === "admin" && newRole !== "admin" && members?.admins?.length === 1) {
        toast.error("You must have at least one admin in the organization")
        return
      }
      await changeUserRole({
        organizationId: currentOrg?.organizationId || "",
        userId,
        currentRole,
        newRole,
      }).unwrap()
      refetch()
      toast.success("User role changed successfully")
    } catch (error) {
      toast.error("Failed to change user role")
    }
  }

  const filteredUsers = useMemo(() => {
    const allUsers = [...(members?.admins || []), ...(members?.instructors || []), ...(members?.learners || [])]

    return allUsers.filter((user) => {
      const matchesSearch = user.emailAddresses?.[0]?.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && members?.admins?.some((admin) => admin.id === user.id)) ||
        (roleFilter === "instructor" && members?.instructors?.some((instructor) => instructor.id === user.id)) ||
        (roleFilter === "learner" && members?.learners?.some((learner) => learner.id === user.id))

      return matchesSearch && matchesRole
    })
  }, [members, searchTerm, roleFilter])

  return (
    <div className="space-y-6">
      <Header title="Organization Settings" subtitle="Manage your organization settings and members" />

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>Invite new members to your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={(value: "admin" | "instructor" | "learner") => setInviteRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="learner">Learner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit">Send Invitation</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage your organization members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={(value: "all" | "admin" | "instructor" | "learner") => setRoleFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="learner">Learner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => {
                    const isAdmin = members?.admins?.some((admin) => admin.id === user.id)
                    const isInstructor = members?.instructors?.some((instructor) => instructor.id === user.id)
                    const isLearner = members?.learners?.some((learner) => learner.id === user.id)
                    const role = isAdmin ? "admin" : isInstructor ? "instructor" : "learner"

                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.emailAddresses?.[0]?.emailAddress || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              role === "admin"
                                ? "bg-red-100 text-red-800"
                                : role === "instructor"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={!user.banned || !user.locked ? "default" : "secondary"}>
                            {!user.banned || !user.locked ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select onValueChange={(newRole) => handleChangeRole(user.id, role, newRole)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder={role.charAt(0).toUpperCase() + role.slice(1)} />
                            </SelectTrigger>
                            <SelectContent>
                              {role !== "admin" && <SelectItem value="admin">Admin</SelectItem>}
                              {role !== "instructor" && <SelectItem value="instructor">Instructor</SelectItem>}
                              {role !== "learner" && <SelectItem value="learner">Learner</SelectItem>}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveUser(user.id, role)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDescription">Description</Label>
              <Textarea
                id="orgDescription"
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgImage">Organization Image</Label>
              <Input
                id="orgImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline">
                Choose Image
              </Button>
            </div>
            {orgImagePreview && (
              <div className="mt-4">
                <Image
                  src={orgImagePreview || "/placeholder.svg"}
                  alt="Organization Image"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="danger">
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Organization</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your organization and remove all
                    associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Yes, delete organization</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSettings

