import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, BookCheck, BarChart3, PlusCircle, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  useGetOrganizationUsersQuery,
  useGetOrganizationCoursesQuery,
  useGetTransactionStatsQuery,
  useCreateCourseMutation,
  useGetOrganizationQuery,
  useCreateTransactionMutation,
  useAddCourseToOrganizationMutation
} from '@/state/api'
import { useRouter } from 'next/navigation'

interface AdminDashboardProps {
  orgId: string
}

const AdminDashboard = ({ orgId }: AdminDashboardProps) => {
    const router = useRouter()
    const { data: currentOrg } = useGetOrganizationQuery(orgId)
    const { data: usersData } = useGetOrganizationUsersQuery(orgId)
    const { data: coursesData } = useGetOrganizationCoursesQuery(orgId)
    const { data: transactionStats } = useGetTransactionStatsQuery()

    const totalUsers = usersData ? (usersData.admins.length + usersData.instructors.length + usersData.learners.length) : 0

    return (
      <div className="space-y-4 p-2">
        {/* Stats Overview */}
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
                  <h3 className="text-2xl font-bold">{coursesData?.length || 0}</h3>
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