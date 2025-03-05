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
  useGetCohortsQuery,
  useUpdateCohortMutation,
  useDeleteCohortMutation,
  useCreateCohortMutation,
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
import { Users, Settings, Shield, Search, Edit, Trash2, PlusCircle, BookOpen } from "lucide-react"
import type { User } from "@clerk/nextjs/server"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { v4 as uuidv4 } from "uuid"

const AdminSettings = () => {
  const router = useRouter()
  const { currentOrg } = useOrganization()
  const [updateOrganization] = useUpdateOrganizationMutation()
  const [deleteOrganization] = useDeleteOrganizationMutation()

  const { data: cohorts, refetch: refetchCohorts } = useGetCohortsQuery(currentOrg?.organizationId || "")
  const [updateCohort] = useUpdateCohortMutation()
  const [deleteCohort] = useDeleteCohortMutation()
  const [createCohort] = useCreateCohortMutation()

  const { data: members, refetch: refetchMembers } = useGetOrganizationUsersQuery(currentOrg?.organizationId || "")
  const [inviteUser, { isLoading: isInviteLoading }] = useInviteUserToOrganizationMutation()
  const [removeUser] = useRemoveUserFromOrganizationMutation()
  const [changeUserRole] = useChangeUserRoleMutation()

  const [orgName, setOrgName] = useState(currentOrg?.name)
  const [orgDescription, setOrgDescription] = useState(currentOrg?.description)
  const [orgImage, setOrgImage] = useState<File | null>(null)
  const [orgImagePreview, setOrgImagePreview] = useState(currentOrg?.image || "")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "instructor" | "learner">("learner")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "instructor" | "learner">("all")

  // Cohort state
  const [isCreateCohortDialogOpen, setIsCreateCohortDialogOpen] = useState(false)
  const [isEditCohortDialogOpen, setIsEditCohortDialogOpen] = useState(false)
  const [newCohortName, setNewCohortName] = useState("")
  const [editCohortId, setEditCohortId] = useState("")
  const [editCohortName, setEditCohortName] = useState("")
  const [cohortSearchTerm, setCohortSearchTerm] = useState("")

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
      formData.append("name", orgName || "")
      formData.append("description", orgDescription || "")
      if (orgImage) {
        formData.append("image", orgImage)
      }

      await updateOrganization({
        organizationId: currentOrg?.organizationId || "",
        formData,
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
      refetchMembers()
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
      refetchMembers()
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
      refetchMembers()
      toast.success("User role changed successfully")
    } catch (error) {
      toast.error("Failed to change user role")
    }
  }

  // Cohort handlers
  const handleCreateCohort = async () => {
    if (!newCohortName.trim()) {
      toast.error("Please enter a cohort name")
      return
    }

    try {
      await createCohort({
        organizationId: currentOrg?.organizationId || "",
        cohortId: uuidv4(),
        name: newCohortName.trim(),
      }).unwrap()
      toast.success("Cohort created successfully")
      setIsCreateCohortDialogOpen(false)
      setNewCohortName("")
      refetchCohorts()
    } catch (error) {
      toast.error("Failed to create cohort")
    }
  }

  const handleEditCohort = async () => {
    if (!editCohortName.trim()) {
      toast.error("Please enter a cohort name")
      return
    }

    try {
      await updateCohort({
        organizationId: currentOrg?.organizationId || "",
        cohortId: editCohortId,
        name: editCohortName.trim(),
      }).unwrap()
      toast.success("Cohort updated successfully")
      setIsEditCohortDialogOpen(false)
      setEditCohortId("")
      setEditCohortName("")
      refetchCohorts()
    } catch (error) {
      toast.error("Failed to update cohort")
    }
  }

  const handleDeleteCohort = async (cohortId: string) => {
    try {
      await deleteCohort({
        organizationId: currentOrg?.organizationId || "",
        cohortId,
      }).unwrap()
      toast.success("Cohort deleted successfully")
      refetchCohorts()
    } catch (error) {
      toast.error("Failed to delete cohort")
    }
  }

  const openEditCohortDialog = (cohort: any) => {
    setEditCohortId(cohort.cohortId)
    setEditCohortName(cohort.name)
    setIsEditCohortDialogOpen(true)
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

  const filteredCohorts = useMemo(() => {
    if (!cohorts) return []

    return cohorts.filter((cohort) => cohort.name.toLowerCase().includes(cohortSearchTerm.toLowerCase()))
  }, [cohorts, cohortSearchTerm])

  return (
    <div className="space-y-4">
      <Header title="Organization Settings" subtitle="Manage your organization settings and members" />

      <Tabs defaultValue="members" className="w-full mb-2">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cohorts
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
                  <Button type="submit">{isInviteLoading ? "Sending..." : "Invite"}</Button>
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
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
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

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cohorts</CardTitle>
                <CardDescription>Manage your organization cohorts</CardDescription>
              </div>
              <Dialog open={isCreateCohortDialogOpen} onOpenChange={setIsCreateCohortDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Cohort
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                        value={newCohortName}
                        onChange={(e) => setNewCohortName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateCohortDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" onClick={handleCreateCohort}>
                      Create Cohort
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search cohorts..."
                    value={cohortSearchTerm}
                    onChange={(e) => setCohortSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Learners</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCohorts.length > 0 ? (
                    filteredCohorts.map((cohort) => (
                      <TableRow key={cohort.cohortId}>
                        <TableCell className="font-medium">{cohort.name}</TableCell>
                        <TableCell>{cohort.learners?.length || 0}</TableCell>
                        <TableCell>{cohort.courses?.length || 0}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/organizations/${currentOrg?.organizationId}/cohorts/${cohort.cohortId}`)
                              }
                            >
                              View
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditCohortDialog(cohort)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the cohort and remove all associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCohort(cohort.cohortId)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No cohorts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Cohort Dialog */}
          <Dialog open={isEditCohortDialogOpen} onOpenChange={setIsEditCohortDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Cohort</DialogTitle>
                <DialogDescription>Update the cohort name. Click save when you&apos;re done.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCohortName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="editCohortName"
                    value={editCohortName}
                    onChange={(e) => setEditCohortName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCohortDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleEditCohort}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-4 p-4">
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
            <div className="space-x-2">
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
          <div className="p-4">
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

