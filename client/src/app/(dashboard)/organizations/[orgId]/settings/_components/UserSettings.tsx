"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

const UserSettings = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  const [name, setName] = useState(user?.fullName || "")
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || "")
  const [receiveNotifications, setReceiveNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleSaveProfile = () => {
    // Here you would typically update the user's profile
    // For this example, we'll just show a success toast
    toast.success("Profile updated successfully")
  }

  const handleSavePreferences = () => {
    // Here you would typically update the user's preferences
    // For this example, we'll just show a success toast
    toast.success("Preferences updated successfully")
  }

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Settings</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile}>Save Profile</Button>
        </TabsContent>
        <TabsContent value="preferences" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="notifications" checked={receiveNotifications} onCheckedChange={setReceiveNotifications} />
            <Label htmlFor="notifications">Receive Notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} />
            <Label htmlFor="darkMode">Dark Mode</Label>
          </div>
          <Button onClick={handleSavePreferences}>Save Preferences</Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UserSettings

