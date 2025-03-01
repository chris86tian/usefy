"use client"

import UserDashboard from "./_components/UserDashboard"
import Header from "@/components/Header"
import { useUser } from "@clerk/nextjs"
import AdminDashboard from "./_components/AdminDashboard"
import { useOrganization } from "@/context/OrganizationContext"
import { Spinner } from "@/components/ui/Spinner"

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
  
  const loadingOrg = false;
  const loadingStats = false;
  
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
  
  const upcomingEvents = [
    {
      id: 1,
      title: "React Workshop",
      date: "March 5, 2025",
      time: "10:00 AM - 12:00 PM",
      participants: 12
    },
    {
      id: 2,
      title: "TypeScript Code Review",
      date: "March 8, 2025",
      time: "2:00 PM - 3:30 PM",
      participants: 8
    },
    {
      id: 3, 
      title: "New Course Planning",
      date: "March 15, 2025",
      time: "11:00 AM - 1:00 PM",
      participants: 5
    }
  ]
  
  if (loadingOrg || loadingStats) return <Spinner />
  
  return (
    <div>
      {/* Organization Header */}
      <Header 
        title={isAdmin ? "Admin Dashboard" : "Organization Dashboard"} 
        subtitle={isAdmin ? "Manage your organization, courses, and users" : "Manage your courses and learning"} 
      />
      
      {/* Render different dashboards based on user type */}
      {isAdmin ? (
        <AdminDashboard
          stats={stats}
          recentActivities={recentActivities}
          upcomingEvents={upcomingEvents}
        />
      ) : (
        <UserDashboard 
          recentActivities={recentActivities}
          upcomingEvents={upcomingEvents}
        />
      )}
    </div>
  )
}