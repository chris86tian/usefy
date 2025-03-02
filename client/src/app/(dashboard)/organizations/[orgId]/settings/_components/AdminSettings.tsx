"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useOrganization } from "@/context/OrganizationContext"
import { toast } from "sonner"
import { useUpdateOrganizationMutation, useDeleteOrganizationMutation } from "@/state/api"
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
import Header from "@/components/Header"

const AdminSettings = () => {
  const router = useRouter()
  const { currentOrg } = useOrganization()
  const [updateOrganization] = useUpdateOrganizationMutation()
  const [deleteOrganization] = useDeleteOrganizationMutation()

  const [orgName, setOrgName] = useState(currentOrg?.name || "")
  const [orgDescription, setOrgDescription] = useState(currentOrg?.description || "")
  const [orgImage, setOrgImage] = useState<File | null>(null)
  const [orgImagePreview, setOrgImagePreview] = useState(currentOrg?.image || "")

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
      router.push("/") // Redirect to home page or organizations list
    } catch (error) {
      toast.error("Failed to delete organization")
    }
  }

  return (
    <div className="space-y-4">
      <Header title="Organization Settings" subtitle="Manage your organization" />
      <div className="space-y-4">
        <div className="space-y-2 flex flex-col">
          <Image
            src={orgImagePreview || "/placeholder.png"}
            alt="Organization Image"
            width={150}
            height={150}
            className="rounded-lg object-cover"
          />  
          <Label htmlFor="orgImage">Organization Image</Label>
          <Input
            id="orgImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button className="w-fit" type="button" onClick={() => fileInputRef.current?.click()} variant="outline">
            Choose Image
          </Button>
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
      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Organization</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your organization and remove all associated
                data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Yes, delete organization</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default AdminSettings

