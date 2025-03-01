"use client"

import { SignedIn, useUser } from "@clerk/nextjs"
import { School, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useGetMyOrganizationsQuery, useCreateOrganizationMutation } from "@/state/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Spinner } from "@/components/ui/Spinner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
})

export function OrganizationsDropdown() {
  const { data: organizations, isLoading, refetch } = useGetMyOrganizationsQuery()
  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation()
  const router = useRouter()
  const { user } = useUser()

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createOrganization(values).unwrap()
      toast.success("Organization created successfully!")
      form.reset()
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
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {org.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
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

