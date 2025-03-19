"use client"

import type React from "react"

import { SignedIn, useUser } from "@clerk/nextjs"
import { School, ChevronRight, Upload, X, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  useGetMyOrganizationsQuery,
  useCreateOrganizationMutation,
  useGetOrganizationsQuery,
  useJoinOrganizationMutation,
} from "@/state/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { useState, useRef } from "react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Spinner } from "@/components/ui/Spinner"
import { useGetUploadImageUrlMutation } from "@/state/api"
import { uploadThumbnail } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import { SignInRequired } from "./SignInRequired"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NotFound from "./NotFound"

const MAX_FILE_SIZE = 5 * 1024 * 1024

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  image: z.any().optional(),
})

export function OrganizationsDropdown() {
  const router = useRouter()
  const { user } = useUser()
  const { data: myOrganizations, isLoading: myOrgsLoading, refetch } = useGetMyOrganizationsQuery()
  const { data: allOrganizations, isLoading: allOrgsLoading, refetch: refetchAll } = useGetOrganizationsQuery()
  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation()
  const [joinOrganization, { isLoading: isJoining }] = useJoinOrganizationMutation()
  const [getUploadImageUrl] = useGetUploadImageUrlMutation()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isSuperAdmin = user?.publicMetadata.userType === "superadmin"
  const [joiningOrgId, setJoiningOrgId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("my-orgs")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  if (!myOrganizations) return null
  if (!allOrganizations) return null
  if (!user) return <SignInRequired />

  const handleOrganizationClick = (orgId: string) => {
    const isAdmin = myOrganizations
      ?.find((org) => org.organizationId === orgId)
      ?.admins?.some((admin) => admin.userId === user?.id)
    const firstCohort = myOrganizations?.find((org) => org.organizationId === orgId)?.cohorts?.[0]

    if (isAdmin || isSuperAdmin) {
      router.push(`/organizations/${orgId}`, { scroll: false })
    } else if (firstCohort) {
      router.push(`/organizations/${orgId}/cohorts/${firstCohort}`, { scroll: false })
    } else {
      router.push(`/organizations/${orgId}`, { scroll: false })
    }
  }

  const handleJoinOrganization = async (orgId: string) => {
    if (!user) return

    setJoiningOrgId(orgId)
    try {
      await joinOrganization(orgId).unwrap()

      toast.success("Successfully joined organization")
      refetch()
      refetchAll()
    } catch (error) {
      toast.error("Failed to join organization")
    } finally {
      setJoiningOrgId(null)
    }
  }

  const isUserMemberOfOrg = (org: any) => {
    if (!user) return false

    return (
      org.admins?.some((admin: any) => admin.userId === user.id) ||
      org.instructors?.some((instructor: any) => instructor.userId === user.id) ||
      org.learners?.some((learner: any) => learner.userId === user.id)
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
      form.setValue("image", file)
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImagePreview(null)
    form.setValue("image", undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const organization = {
        organizationId: uuidv4(),
        name: values.name,
        description: values.description,
        image: "",
        admins: [],
        instructors: [],
        learners: [],
        courses: [],
      }

      if (values.image) {
        const imageFormData = new FormData()
        imageFormData.append("file", values.image)

        organization.image = await uploadThumbnail(
          organization.organizationId,
          getUploadImageUrl,
          imageFormData.get("file") as File,
        )
      }

      await createOrganization(organization).unwrap()

      toast.success("Organization created successfully!")
      form.reset()
      setImagePreview(null)
      refetch()
      refetchAll()
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  return (
    <SignedIn>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <School className="h-5 w-5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[350px]">
          {isSuperAdmin && (
            <Tabs defaultValue="my-orgs" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="my-orgs">My Organizations</TabsTrigger>
                <TabsTrigger value="all-orgs">All Organizations</TabsTrigger>
              </TabsList>

              <TabsContent value="my-orgs">
                <DropdownMenuLabel className="text-lg font-semibold">Your Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {myOrgsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : myOrganizations?.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {myOrganizations.map((org) => (
                      <DropdownMenuItem
                        key={org.organizationId}
                        onClick={() => handleOrganizationClick(org.organizationId)}
                        className="flex items-center justify-between p-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {org.image ? (
                              <AvatarImage src={org.image} alt={org.name} />
                            ) : (
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {org.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {user?.publicMetadata?.userType === "superadmin"
                                ? "Super Admin"
                                : org.admins?.some((admin) => admin.userId === user?.id)
                                  ? "Admin"
                                  : org.instructors?.some((instructor) => instructor.userId === user?.id)
                                    ? "Instructor"
                                    : "Learner"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4">
                    <School className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">You aren&apos;t a member of any organizations yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all-orgs">
                <DropdownMenuLabel className="text-lg font-semibold">All Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {allOrgsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : allOrganizations?.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {allOrganizations.map((org) => {
                      const isMember = isUserMemberOfOrg(org)

                      return (
                        <div key={org.organizationId} className="flex items-center justify-between p-3 hover:bg-accent">
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => handleOrganizationClick(org.organizationId)}
                          >
                            <Avatar>
                              {org.image ? (
                                <AvatarImage src={org.image} alt={org.name} />
                              ) : (
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {org.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{org.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {isMember
                                  ? user?.publicMetadata?.userType === "superadmin"
                                    ? "Super Admin"
                                    : org.admins?.some((admin) => admin.userId === user?.id)
                                      ? "Admin"
                                      : org.instructors?.some((instructor) => instructor.userId === user?.id)
                                        ? "Instructor"
                                        : "Learner"
                                  : "Not a member"}
                              </p>
                            </div>
                          </div>

                          {!isMember && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleJoinOrganization(org.organizationId)
                              }}
                              disabled={joiningOrgId === org.organizationId}
                              className="ml-2"
                            >
                              {joiningOrgId === org.organizationId ? (
                                <Spinner className="h-4 w-4 mr-1" />
                              ) : (
                                <UserPlus className="h-4 w-4 mr-1" />
                              )}
                              {joiningOrgId === org.organizationId ? "Joining..." : "Join"}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4">
                    <School className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">No organizations found.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {!isSuperAdmin && (
            <>
              <DropdownMenuLabel className="text-lg font-semibold">Your Organizations</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {myOrgsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : myOrganizations?.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {myOrganizations.map((org) => (
                    <DropdownMenuItem
                      key={org.organizationId}
                      onClick={() => handleOrganizationClick(org.organizationId)}
                      className="flex items-center justify-between p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {org.image ? (
                            <AvatarImage src={org.image} alt={org.name} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {org.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {user?.publicMetadata?.userType === "superadmin"
                              ? "Super Admin"
                              : org.admins?.some((admin) => admin.userId === user?.id)
                                ? "Admin"
                                : org.instructors?.some((instructor) => instructor.userId === user?.id)
                                  ? "Instructor"
                                  : "Learner"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuItem>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4">
                  <School className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">You aren&apos;t a member of any organizations yet.</p>
                </div>
              )}
            </>
          )}

          {isSuperAdmin && activeTab === "my-orgs" && (
            <div className="p-4 space-y-4 border-t">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel>Organization Logo</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {imagePreview ? (
                              <div className="relative w-full h-32 rounded-md overflow-hidden border border-input">
                                <Image
                                  src={imagePreview || "/placeholder.svg"}
                                  alt="Preview"
                                  fill
                                  style={{ objectFit: "cover" }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8"
                                  onClick={clearImage}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Click to upload an image</p>
                                <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (Max 5MB)</p>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Upload your organization logo or icon</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your organization"
                            className="resize-none h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Organization"}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </SignedIn>
  )
}

