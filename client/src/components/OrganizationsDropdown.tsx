"use client"

import { SignedIn, useUser } from "@clerk/nextjs"
import { School, ChevronRight, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useGetMyOrganizationsQuery, useCreateOrganizationMutation } from "@/state/api"
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  image: z.instanceof(File).optional(),
})

export function OrganizationsDropdown() {
  const { data: organizations, isLoading, refetch } = useGetMyOrganizationsQuery()
  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation()
  const [ getUploadImageUrl ] = useGetUploadImageUrlMutation()
  const router = useRouter()
  const { user } = useUser()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  if (!organizations) return null

  const handleOrganizationClick = (orgId: string) => {
    router.push(`/organizations/${orgId}`, { scroll: false })
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
  
        organization.image = await uploadThumbnail(organization.organizationId, getUploadImageUrl, imageFormData.get("file") as File)
      }
  
      await createOrganization(organization).unwrap()
  
      toast.success("Organization created successfully!")
      form.reset()
      setImagePreview(null)
      refetch()
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
        <DropdownMenuContent className="w-[300px]">
          <DropdownMenuLabel className="text-lg font-semibold">Your Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isLoading ? (
            <Spinner />
          ) : organizations?.length > 0 ? (
            <>
              {organizations.map((org) => (
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
                        {org.admins?.some((admin) => admin.userId === user?.id)
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
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="text-center py-6 px-4">
              <School className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">You aren&apos;t a member of any organizations yet.</p>
            </div>
          )}

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
                                src={imagePreview} 
                                alt="Preview" 
                                fill 
                                style={{ objectFit: 'cover' }} 
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
                      <FormDescription>
                        Upload your organization logo or icon
                      </FormDescription>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </SignedIn>
  )
}