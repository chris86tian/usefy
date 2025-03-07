import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, BookCheck, BarChart3, Clock, CalendarDays, Rocket, PlusCircle, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AdminDashboardProps {
  stats: any
  recentActivities: any[]
}

const AdminDashboard = ({ stats, recentActivities }: AdminDashboardProps) => {
    return (
      <div className="space-y-6 p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <h3 className="text-2xl font-bold">{stats?.totalUsers || 120}</h3>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-green-500">+5%</span> from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Courses</p>
                  <h3 className="text-2xl font-bold">{stats?.activeCourses || 15}</h3>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-green-500">+2</span> new this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <h3 className="text-2xl font-bold">{stats?.completionRate || '78%'}</h3>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <BookCheck className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-green-500">+3%</span> from last quarter
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
                  <h3 className="text-2xl font-bold">${stats?.revenue?.toLocaleString() || '24,500'}</h3>
                </div>
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900">
                  <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-green-500">+12%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Course
              </Button>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" /> Manage Users
              </Button>
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" /> Course Analytics
              </Button>
              <Button variant="outline">
                <Rocket className="mr-2 h-4 w-4" /> Publish Updates
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Activities and Events */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Latest actions from your organization members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback>{activity.user.fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        <span className="text-gray-500">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

export default AdminDashboard;