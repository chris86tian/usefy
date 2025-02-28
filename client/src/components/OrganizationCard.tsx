import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrganizationCardProps {
  organization: Organization
  isSelected?: boolean
  onClick?: () => void
}

export function OrganizationCard({ organization, isSelected, onClick }: OrganizationCardProps) {
  return (
    <Card className={cn("cursor-pointer", isSelected ? "bg-gray-700" : "bg-gray-800")}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {organization.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{organization.name}</CardTitle>
            <CardDescription>{organization.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {organization.admins.length + organization.instructors.length + organization.learners.length} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{organization.courses.length} courses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

