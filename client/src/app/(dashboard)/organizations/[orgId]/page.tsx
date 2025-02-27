"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Users, BookOpen, BarChart3, Clock, CalendarDays, BookCheck, 
  Rocket, PlusCircle, ChevronRight
} from "lucide-react"
// import { useGetOrganizationDetailsQuery, useGetOrganizationStatsQuery } from "@/state/api" // Adjust based on your API
import Loading from "@/components/Loading" // Adjust path to your loading component
import Header from "@/components/Header"

export default function OrganizationDashboard() {
  const { orgId } = useParams()
//   const { 
//     data: organization, 
//     isLoading: loadingOrg 
//   } = useGetOrganizationDetailsQuery(orgId as string, { 
//     skip: !orgId 
//   })
  
//   const { 
//     data: stats, 
//     isLoading: loadingStats 
//   } = useGetOrganizationStatsQuery(orgId as string, { 
//     skip: !orgId 
//   })
  
  // Mock data for demonstration - replace with your actual data
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
  
//   if (loadingOrg || loadingStats) {
//     return (
//       <div className="flex h-full w-full items-center justify-center min-h-[500px]">
//         <Loading />
//       </div>
//     )
//   }
  
//   if (!organization) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
//         <h1 className="text-2xl font-bold">Organization Not Found</h1>
//         <p className="text-gray-500">The organization you are looking for does not exist.</p>
//       </div>
//     )
//   }
  
  return (
    <div className="space-y-4">
      {/* Organization Header */}
      <Header title="Organization Dashboard" subtitle="Manage your organization and courses" />
      <div className="flex items-start justify-between">
        {/* <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">{organization.description}</p>
        </div> */}
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Members</p>
                {/* <h3 className="text-2xl font-bold">{stats?.memberCount || 0}</h3> */}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Courses</p>
                {/* <h3 className="text-2xl font-bold">{stats?.courseCount || 0}</h3> */}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <BookCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                {/* <h3 className="text-2xl font-bold">{stats?.completionRate || 0}%</h3> */}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Learners</p>
                {/* <h3 className="text-2xl font-bold">{stats?.activeLearners || 0}</h3> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity and Events Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                The latest activity from members in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                      <AvatarFallback>{activity.user.fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {" "}
                        <span className="text-gray-500">{activity.action}</span>
                        {" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-2">
                  View All Activity
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>
                Scheduled sessions and events for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center gap-6 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarDays className="mr-1 h-3 w-3" />
                          {event.date}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Users className="mr-1 h-3 w-3" />
                          {event.participants} participants
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-2">
                  Schedule New Event
                  <PlusCircle className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Popular Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Courses</CardTitle>
          <CardDescription>
            The most active courses in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Replace with your actual course data */}
            {[1, 2, 3].map((course) => (
              <div key={course} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Rocket className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Advanced React Patterns</h4>
                    <p className="text-xs text-gray-500">32 learners active this week</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Course
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}