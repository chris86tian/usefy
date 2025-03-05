"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, Users, BookOpen, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { 
  useGetOrganizationCoursesQuery,
  useGetCohortsQuery,
 } from "@/state/api";
import CourseCard from "@/components/CourseCard";
import { Spinner } from "@/components/ui/Spinner";
import { useEffect } from "react";

interface SelectedOrganizationProps {
  organization: Organization;
  handleJoinOrg: (orgId: string) => void;
}

export function SelectedOrganization({
  organization,
  handleJoinOrg,
}: SelectedOrganizationProps) {
  const { user } = useUser();
  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useGetOrganizationCoursesQuery(organization.organizationId, {
    skip: false,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: cohorts,
    isLoading: isLoadingCohorts,
    isError: isErrorCohorts,
    error: errorCohorts,
  } = useGetCohortsQuery(organization.organizationId, {
    skip: false,
    refetchOnMountOrArgChange: true,
  });

  const admins = organization.admins || [];
  const instructors = organization.instructors || [];
  const learners = organization.learners || [];

  const isUserMember =
    admins.some((admin) => admin.userId === user?.id) ||
    instructors.some((instructor) => instructor.userId === user?.id) ||
    learners.some((learner) => learner.userId === user?.id);

  const totalMembers = admins.length + instructors.length + learners.length;

  return (
    <Card className="h-full overflow-hidden shadow-lg border border-border">
      <CardHeader className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                {organization.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {organization.description || "Educational organization"}
              </CardDescription>
            </div>
          </div>

          {!isUserMember ? (
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 transition-all text-white"
              onClick={() => handleJoinOrg(organization.organizationId)}
            >
              <CheckCircle className="h-4 w-4" />
              <p>Join</p>
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full">
              <BadgeCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Member</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap mt-4 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">{totalMembers} Members</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm">{courses?.length} Courses</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            {isLoading ? (
              <Spinner />
            ) : isError ? (
              <div className="p-8 text-center rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-destructive">
                  {error && "status" in error && error.status === 404
                    ? "No courses available for this organization yet."
                    : "Failed to load courses. Please try again later."}
                </p>
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses?.map((course: Course) => (
                  <CourseCard
                    key={course.courseId}
                    course={course}
                    isEnrolled={true}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-lg bg-muted border border-border">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No courses available for this organization yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-xl font-semibold mb-3">
                About {organization.name}
              </h3>
              <p className="text-muted-foreground mb-4">
                {organization.description ||
                  "This organization is dedicated to providing quality education and learning resources."}
              </p>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Cohorts</h4>

                {isLoadingCohorts ? (
                  <Spinner />
                ) : isErrorCohorts ? (
                  <div className="p-4 text-center rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-destructive">
                      {errorCohorts && "status" in errorCohorts && errorCohorts.status === 404
                        ? "No cohorts available for this organization yet."
                        : "Failed to load cohorts. Please try again later."}
                    </p>
                  </div>
                ) : cohorts && cohorts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cohorts.map((cohort: Cohort) => (
                      <div key={cohort.cohortId} className="p-4 border rounded-lg bg-muted">
                        <h4 className="text-md font-medium">{cohort.name}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-lg bg-muted border border-border">
                    <p className="text-muted-foreground">No cohorts available for this organization yet.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
