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
import { useParams, useRouter } from "next/navigation"
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
import { useUser } from "@clerk/nextjs"
import { getUserName, uploadThumbnail } from "@/lib/utils"
import { useGetUploadImageUrlMutation } from "@/state/api"
import NotFound from "@/components/NotFound"
import { SignInRequired } from "@/components/SignInRequired"
import { Spinner } from "@/components/ui/Spinner"

const AdminSettings = () => {
  const router = useRouter()
  const { user } = useUser()
  const { currentOrg } = useOrganization()
  const { orgId } = useParams() as { orgId: string; cohortId: string }

  const [updateOrganization, { isLoading: isUpdateLoading } ] = useUpdateOrganizationMutation()
  const [deleteOrganization, { isLoading: isDeleteLoading } ] = useDeleteOrganizationMutation()

  const { 
    data: cohorts,
    isLoading: isCohortsLoading,
    refetch: refetchCohorts
  } = useGetCohortsQuery(orgId)
  const [updateCohort,
    { isLoading: isUpdateCohortLoading }
  ] = useUpdateCohortMutation()
  const [deleteCohort,
    { isLoading: isDeleteCohortLoading }
  ] = useDeleteCohortMutation()
  const [createCohort,
    { isLoading: isCreateCohortLoading }
  ] = useCreateCohortMutation()

  const { 
    data: members, 
    isLoading: isMembersLoading,
    refetch: refetchMembers 
  } = useGetOrganizationUsersQuery(orgId)
  const [inviteUser, { isLoading: isInviteLoading }] = useInviteUserToOrganizationMutation()
  const [removeUser,
    { isLoading: isRemoveUserLoading }
  ] = useRemoveUserFromOrganizationMutation()
  const [changeUserRole,
    { isLoading: isChangeUserRoleLoading }
  ] = useChangeUserRoleMutation()
  const [roleSelections, setRoleSelections] = useState<Record<string, string>>({});

  const [orgName, setOrgName] = useState(currentOrg?.name)
  const [orgDescription, setOrgDescription] = useState(currentOrg?.description)
  const [orgImage, setOrgImage] = useState<File | null>(null)
  const [orgImagePreview, setOrgImagePreview] = useState(currentOrg?.image)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "instructor" | "learner">("learner")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "instructor" | "learner">("all")
  
  const [isCreateCohortDialogOpen, setIsCreateCohortDialogOpen] = useState(false)
  const [isEditCohortDialogOpen, setIsEditCohortDialogOpen] = useState(false)
  const [newCohortName, setNewCohortName] = useState("")
  const [editCohortId, setEditCohortId] = useState("")
  const [editCohortName, setEditCohortName] = useState("")
  const [cohortSearchTerm, setCohortSearchTerm] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [getUploadImageUrl] = useGetUploadImageUrlMutation()

  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [emailBatch, setEmailBatch] = useState<string[]>([]);

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

  if (isMembersLoading || isCohortsLoading) return <Spinner />
  if (!user) return <SignInRequired />
  if (!members) return <NotFound message="Members not found" />
  if (!currentOrg) return <NotFound message="Organization not found" />

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
        const imageFormData = new FormData()
        imageFormData.append("file", orgImage)
        const imageUrl = await uploadThumbnail(orgId, getUploadImageUrl, imageFormData.get("file") as File)
        formData.append("image", imageUrl)
      }

      await updateOrganization({ organizationId: orgId, formData }).unwrap()
      toast.success("Organization updated successfully")
    } catch (error) {
      toast.error("Failed to update organization")
    }
  }

  const handleDelete = async () => {
    try {
      if (user?.publicMetadata?.userType !== "superadmin") {
        toast.error("You are not authorized to delete this organization")
        return
      }
      await deleteOrganization(orgId).unwrap()
      toast.success("Organization deleted successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to delete organization")
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailBatch.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    try {
      await Promise.all(
        emailBatch.map((email) =>
          inviteUser({
            organizationId: orgId,
            email: email.trim(),
            role: inviteRole,
          }).unwrap()
        )
      );
      toast.success(`Invitations sent to ${emailBatch.length} users`);
      setEmailBatch([]);
      setInviteEmail("");
      refetchMembers();
    } catch (error) {
      toast.error("Failed to send invitations");
    }
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInviteEmail(value);

    if (value.includes(',')) {
      const emails = value
        .split(/[,\s]+/)
        .map(email => email.trim())
        .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      if (emails.length > 0) {
        setEmailBatch(prev => [...new Set([...prev, ...emails])]);
        setInviteEmail('');
      }
    }
  };

  const handleRemoveUser = async (userId: string, role: string) => {
    if (role === "admin") {
      toast.error("You cannot remove another admin.");
      return;
    }

    try {
      await removeUser({ organizationId: orgId, userId, role }).unwrap();
      toast.success("User removed successfully");
      refetchMembers();
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === "admin" && newRole !== "admin" && members.admins.length === 1) {
      toast.error("You must have at least one admin in the organization");
      return;
    }

    try {
      await changeUserRole({
        organizationId: orgId,
        userId,
        currentRole,
        newRole,
      }).unwrap();

      setRoleSelections(prev => ({
        ...prev,
        [userId]: ""
      }));

      toast.success("User role changed successfully");
      refetchMembers();
    } catch (error) {
      toast.error("Failed to change user role");
    }
  };
  

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
                  <div className="flex flex-col gap-2">
                    <Input
                      type="email"
                      placeholder="Email addresses (comma separated)"
                      value={inviteEmail}
                      onChange={handleEmailInput}
                    />
                    {emailBatch.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {emailBatch.map((email, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {email}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => setEmailBatch(prev => prev.filter(e => e !== email))}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <Button type="submit" disabled={isInviteLoading}>
                    {isInviteLoading ? "Sending..." : `Invite ${emailBatch.length > 0 ? emailBatch.length : ''} Users`}
                  </Button>
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
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{getUserName(user)}</span>
                            <span className="text-sm text-muted-foreground">{user.emailAddresses?.[0]?.emailAddress || "N/A"}</span>
                          </div>
                        </TableCell>
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
                            {!user.banned || !user.locked || user.passwordEnabled ? "Active" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            disabled={role === "admin" || isChangeUserRoleLoading}
                            value={roleSelections[user.id] || ""}
                            onValueChange={(newRole) => {
                              setRoleSelections(prev => ({
                                ...prev,
                                [user.id]: newRole
                              }));
                              handleChangeRole(user.id, role, newRole);
                            }}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder={role.charAt(0).toUpperCase() + role.slice(1)}/>
                            </SelectTrigger>
                            <SelectContent>
                              {role !== "admin" && <SelectItem value="admin">Admin</SelectItem>}
                              {role !== "instructor" && <SelectItem value="instructor">Instructor</SelectItem>}
                              {role !== "learner" && <SelectItem value="learner">Learner</SelectItem>}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={role === "admin" || isRemoveUserLoading}
                            onClick={() => handleRemoveUser(user.id, role)}
                          >
                            {isRemoveUserLoading ? "Removing..." : "Remove"}
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
                    <Button 
                      type="submit" 
                      disabled={isCreateCohortLoading}
                      onClick={handleCreateCohort}
                    >
                      {isCreateCohortLoading ? "Creating..." : "Create Cohort"}
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
                        <TableCell>{cohort.learners.length}</TableCell>
                        <TableCell>{cohort.courses.length}</TableCell>
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
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCohort(cohort.cohortId)}
                                    disabled={isDeleteCohortLoading}
                                  >
                                    {isDeleteCohortLoading ? "Deleting..." : "Delete Cohort"}
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
                <Button 
                  type="submit" 
                  disabled={isUpdateCohortLoading}
                  onClick={handleEditCohort}
                >
                  {isUpdateCohortLoading ? "Updating..." : "Update Cohort"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-4 p-4">
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
                  width={100}
                  height={100}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
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
            <Button 
              disabled={isUpdateLoading}
              onClick={handleSave}
            >
              {isUpdateLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="danger">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={user?.publicMetadata?.userType !== "superadmin" || isDeleteLoading}
                >
                  {isDeleteLoading ? "Deleting..." : "Delete Organization"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. To confirm, please type &quot;DELETE {currentOrg?.name}&quot;
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={`DELETE ${currentOrg?.name}`}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteConfirmation !== `DELETE ${currentOrg?.name}` || isDeleteLoading}
                  >
                    {isDeleteLoading ? "Deleting..." : "Delete Organization"}
                  </AlertDialogAction>
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

