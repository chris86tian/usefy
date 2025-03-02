import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizationCardProps {
  organization: Organization;
  isSelected?: boolean;
  onClick?: () => void;
}

export function OrganizationCard({
  organization,
  isSelected,
  onClick,
}: OrganizationCardProps) {
  const admins = organization.admins || [];
  const instructors = organization.instructors || [];
  const learners = organization.learners || [];
  const courses = organization.courses || [];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent",
        isSelected && "bg-accent border-primary"
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {organization.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{organization.name}</CardTitle>
            <CardDescription className="line-clamp-1">
              {organization.description || "Educational organization"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {admins.length + instructors.length + learners.length} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {courses.length} courses
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
