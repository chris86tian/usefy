import { useGetUserQuery } from "@/state/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminCardProps {
    adminId: string
    index: number
}

const AdminCard = ({ adminId, index }: AdminCardProps) => {
    const { data: adminData, isLoading } = useGetUserQuery(adminId)

    return (
        <div className="flex items-center gap-3 shadow-sm p-4 rounded-lg border border-gray-200">
        <Avatar className="h-10 w-10">
            {adminData?.imageUrl ? (
            <AvatarImage src={adminData.imageUrl} alt={adminData.fullName || `Admin ${index + 1}`} />
            ) : (
            <AvatarFallback className="bg-blue-600/30 text-blue-200">
                {adminData?.fullName ? adminData.fullName.charAt(0).toUpperCase() : `A${index + 1}`}
            </AvatarFallback>
            )}
        </Avatar>
        <div>
            <p className="text-sm font-medium mb-1">
            {isLoading ? "Loading..." : (adminData?.fullName || adminData?.firstName + " " + adminData?.lastName || "Admin")}
            </p>
            <p className="text-xs text-gray-400">Organization Admin</p>
        </div>
        </div>
    )
}

export default AdminCard