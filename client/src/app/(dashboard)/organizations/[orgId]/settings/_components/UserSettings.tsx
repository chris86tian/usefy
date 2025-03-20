"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { SignInRequired } from "@/components/SignInRequired"
import Header from "@/components/Header"
import { useLeaveOrganizationMutation, useGetMyOrganizationsQuery } from "@/state/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { LogOut, School, Bell, Moon, BookOpen } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import NotFound from "@/components/NotFound"

const UserSettings = () => {
  const router = useRouter()
  const { user } = useUser()
  const { data: myOrganizations, refetch } = useGetMyOrganizationsQuery()
  const [leaveOrganization, { isLoading: isLeaving }] = useLeaveOrganizationMutation()

  // Notification preferences
  const [receiveNotifications, setReceiveNotifications] = useState(true)
  const [emailFrequency, setEmailFrequency] = useState("daily")
  const [courseReminders, setCourseReminders] = useState(true)
  const [assignmentReminders, setAssignmentReminders] = useState(true)

  // Display preferences
  const [darkMode, setDarkMode] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)

  // Learning preferences
  const [showCompletedCourses, setShowCompletedCourses] = useState(true)
  const [autoPlayVideos, setAutoPlayVideos] = useState(true)
  const [preferredLanguage, setPreferredLanguage] = useState("english")

  // Organization to leave
  const [selectedOrgId, setSelectedOrgId] = useState("")

  const handleSavePreferences = () => {
    // Here you would typically update the user's preferences in your backend
    toast.success("Preferences updated successfully")
  }

  const handleLeaveOrganization = async () => {
    if (!selectedOrgId) {
      toast.error("Please select an organization")
      return
    }

    try {
      await leaveOrganization(selectedOrgId).unwrap()
      refetch()
      router.push("/")
    } catch (error) {
      toast.error("Failed to leave organization")
    }
  }

  if (!user) return <SignInRequired />
  if (!myOrganizations) return <NotFound message="Organizations not found" />

  return (
    <div className="space-y-6 max-w-4xl">
      <Header title="Settings" subtitle="Manage your account preferences" />

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Receive Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable all notifications</p>
                </div>
                <Switch id="notifications" checked={receiveNotifications} onCheckedChange={setReceiveNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailFrequency">Email Digest Frequency</Label>
                  <p className="text-sm text-muted-foreground">How often you want to receive email summaries</p>
                </div>
                <Select value={emailFrequency} onValueChange={setEmailFrequency} disabled={!receiveNotifications}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="courseReminders">Course Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminders about upcoming course deadlines</p>
                </div>
                <Switch
                  id="courseReminders"
                  checked={courseReminders}
                  onCheckedChange={setCourseReminders}
                  disabled={!receiveNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="assignmentReminders">Assignment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminders about assignment due dates</p>
                </div>
                <Switch
                  id="assignmentReminders"
                  checked={assignmentReminders}
                  onCheckedChange={setAssignmentReminders}
                  disabled={!receiveNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Display Preferences
              </CardTitle>
              <CardDescription>Customize how the platform looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                </div>
                <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="highContrast">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better readability</p>
                </div>
                <Switch id="highContrast" checked={highContrast} onCheckedChange={setHighContrast} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="largeText">Large Text</Label>
                  <p className="text-sm text-muted-foreground">Increase text size throughout the platform</p>
                </div>
                <Switch id="largeText" checked={largeText} onCheckedChange={setLargeText} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learning Preferences
              </CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showCompletedCourses">Show Completed Courses</Label>
                  <p className="text-sm text-muted-foreground">Display completed courses in your dashboard</p>
                </div>
                <Switch
                  id="showCompletedCourses"
                  checked={showCompletedCourses}
                  onCheckedChange={setShowCompletedCourses}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPlayVideos">Auto-Play Videos</Label>
                  <p className="text-sm text-muted-foreground">Automatically play videos in courses</p>
                </div>
                <Switch id="autoPlayVideos" checked={autoPlayVideos} onCheckedChange={setAutoPlayVideos} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="preferredLanguage">Preferred Language</Label>
                  <p className="text-sm text-muted-foreground">Select your preferred language for content</p>
                </div>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSavePreferences} 
            className="w-auto justify-center"
          >
            Save All Preferences
          </Button>
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Organization Management
              </CardTitle>
              <CardDescription>Manage your organization memberships</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myOrganizations.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Select Organization</Label>
                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                      <SelectTrigger id="organization">
                        <SelectValue placeholder="Select an organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {myOrganizations.map((org) => (
                          <SelectItem key={org.organizationId} value={org.organizationId}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={!selectedOrgId || isLeaving}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {isLeaving ? "Leaving..." : "Leave Organization"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove you from the organization. You will lose access to all courses, cohorts, and
                          resources associated with this organization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeaveOrganization}>Yes, leave organization</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="text-center py-6">
                  <School className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">You are not a member of any organizations.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UserSettings

