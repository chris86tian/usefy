"use client"

import React from "react"
import { useState, useRef } from "react"
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
import { Users, Settings, Shield } from "lucide-react"
import { User } from "@clerk/nextjs/server"

const AdminSettings = () => {
  const router = useRouter()
  const { currentOrg } = useOrganization()
  const { data: members } = useGetOrganizationUsersQuery(currentOrg?.organizationId || "")
  const [updateOrganization] = useUpdateOrganizationMutation()
  const [deleteOrganization] = useDeleteOrganizationMutation()
  const [inviteUser] = useInviteUserToOrganizationMutation()

  const [orgName, setOrgName] = useState(currentOrg?.name || "")
  const [orgDescription, setOrgDescription] = useState(currentOrg?.description || "")
  const [orgImage, setOrgImage] = useState<File | null>(null)
  const [orgImagePreview, setOrgImagePreview] = useState(currentOrg?.image || "")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "instructor" | "learner">("learner")


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
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

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
                  {members?.admins?.map((admin: User) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.emailAddresses?.[0]?.emailAddress || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">Admin</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={!admin.banned || !admin.locked ? "default" : "secondary"}>
                          {!admin.banned || !admin.locked ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {members?.instructors?.map((instructor: User) => (
                    <TableRow key={instructor.id}>
                      <TableCell>{instructor.emailAddresses?.[0]?.emailAddress || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">Instructor</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={!instructor.banned || !instructor.locked ? "default" : "secondary"}>
                          {!instructor.banned || !instructor.locked ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {members?.learners?.map((learner: User) => (
                    <TableRow key={learner.id}>
                      <TableCell>{learner.emailAddresses?.[0]?.emailAddress || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Learner</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={!learner.banned || !learner.locked ? "default" : "secondary"}>
                          {!learner.banned || !learner.locked ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Update your organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Image
                    src={orgImagePreview || "/placeholder.png"}
                    alt="Organization Image"
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                  <div className="space-y-2">
                    <Input
                      id="orgImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline">
                      Change Image
                    </Button>
                  </div>
                </div>
              </div>

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

              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSettings

