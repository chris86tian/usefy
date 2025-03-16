import { Card, CardContent } from '@/components/ui/card'
import { Users, BookOpen } from 'lucide-react'
import { 
  useGetOrganizationUsersQuery,
  useGetOrganizationCoursesQuery,
} from '@/state/api'
import NotFound from '@/components/NotFound'
import { Spinner } from '@/components/ui/Spinner'

interface AdminDashboardProps {
  orgId: string
}

const AdminDashboard = ({ orgId }: AdminDashboardProps) => {
    const { 
      data: orgUsers,
      isLoading: usersLoading,
    } = useGetOrganizationUsersQuery(orgId)
    const { 
      data: orgCourses,
      isLoading: coursesLoading, 
    } = useGetOrganizationCoursesQuery(orgId)

    if (usersLoading || coursesLoading) return <Spinner />
    if (!orgUsers || !orgCourses) return <NotFound message={!orgUsers ? "Organization Users not found" : "Organization Courses not found"} />

    const totalUsers = orgUsers.admins.length + orgUsers.instructors.length + orgUsers.learners.length

    return (
      <div className="space-y-4 p-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <h3 className="text-2xl font-bold">{totalUsers}</h3>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Courses</p>
                  <h3 className="text-2xl font-bold">{orgCourses.length}</h3>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

export default AdminDashboard;