import { SignInRequired } from "@/components/SignInRequired"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@clerk/nextjs"
import { Users } from "lucide-react"

interface UserDashboardProps {
  orgId: string
}

const UserDashboard = ({ orgId }: UserDashboardProps) => {
    const { user } = useUser()

    if (!user) return <SignInRequired />

    return (
      <>
        <div className="space-y-4 p-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User</p>
                    <h3 className="text-2xl font-bold">{user.firstName + " " + user.lastName}</h3>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
}

export default UserDashboard;