"use client"

import UserDashboard from "./_components/UserDashboard"
import Header from "@/components/Header"
import { useUser } from "@clerk/nextjs"
import AdminDashboard from "./_components/AdminDashboard"
import { useOrganization } from "@/context/OrganizationContext"

export default function OrganizationDashboard() {
  const { user } = useUser()
  const { currentOrg } = useOrganization()
  const isAdmin = currentOrg?.admins.some((admin) => admin.userId === user?.id)
  
  const stats = {
    totalUsers: 120,
    activeCourses: 15,
    completionRate: "78%",
    revenue: 24500
  }
  
  const recentActivities = [
    {
      id: 1,
      user: {
        name: "Sarah Johnson",
        avatar: "/avatars/sarah.jpg",
        fallback: "SJ"
      },
      action: "completed",
      target: "Introduction to React",
      time: "2 hours ago"
    },
    {
      id: 2,
      user: {
        name: "Michael Chen",
        avatar: "/avatars/michael.jpg",
        fallback: "MC"
      },
      action: "enrolled in",
      target: "Advanced TypeScript",
      time: "5 hours ago"
    },
    {
      id: 3,
      user: {
        name: "Aisha Patel",
        avatar: "/avatars/aisha.jpg",
        fallback: "AP"
      },
      action: "submitted",
      target: "Final Project",
      time: "Yesterday"
    },
    {
      id: 4,
      user: {
        name: "James Wilson",
        avatar: "/avatars/james.jpg",
        fallback: "JW" 
      },
      action: "joined",
      target: "the organization",
      time: "2 days ago"
    }
  ]
  
  return (
    <div>
      <Header 
        title={isAdmin ? "Admin Dashboard" : "Organization Dashboard"} 
        subtitle={isAdmin ? "Manage your organization, courses, and users" : "Manage your courses and learning"} 
      />
      
      {isAdmin ? (
        <AdminDashboard
          orgId={currentOrg?.organizationId as string}
        />
      ) : (
        <UserDashboard 
          orgId={currentOrg?.organizationId as string}
          recentActivities={recentActivities}
        />
      )}
    </div>
  )
}