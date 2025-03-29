"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/Spinner';
import { 
  Users, 
  GraduationCap, 
  BookOpen,
  BarChart3,
  Plus,
  UserPlus,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  useGetOrganizationUsersQuery,
  useGetOrganizationCoursesQuery,
  useGetCohortsQuery,
  useGetMyUserCourseProgressesQuery,
} from '@/state/api';
import NotFound from '@/components/NotFound';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from '@/components/Header';

interface AdminDashboardProps {
  orgId: string;
}

export default function AdminDashboard({ orgId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const { user: clerkUser } = useUser();
  
  // Fetch organization users
  const { 
    data: orgUsers,
    isLoading: usersLoading,
  } = useGetOrganizationUsersQuery({organizationId: orgId});

  // Fetch organization courses
  const { 
    data: orgCourses = [],
    isLoading: coursesLoading, 
  } = useGetOrganizationCoursesQuery(orgId);

  // Fetch organization cohorts
  const {
    data: cohorts = [],
    isLoading: cohortsLoading,
  } = useGetCohortsQuery(orgId);

  // Fetch course progress data
  const {
    data: progressData = [],
    isLoading: progressLoading,
  } = useGetMyUserCourseProgressesQuery(orgId);

  // Calculate course completion stats
  const courseCompletionStats = orgCourses.map(course => {
    const courseProgress = progressData.filter(p => p.courseId === course.courseId);
    const totalUsers = courseProgress.length;
    const completedUsers = courseProgress.filter(p => p.overallProgress === 100).length;
    const averageProgress = totalUsers > 0 
      ? courseProgress.reduce((sum, p) => sum + p.overallProgress, 0) / totalUsers 
      : 0;
    
    return {
      courseId: course.courseId,
      title: course.title,
      totalUsers,
      completedUsers,
      averageProgress: Math.round(averageProgress)
    };
  });

  if (usersLoading || coursesLoading || cohortsLoading || progressLoading) {
    return <Spinner />;
  }

  if (!orgUsers) return <NotFound message="Organization users not found" />;

  const handleCreateCourseInCohort = (cohortId: string) => {
    router.push(`/organizations/${orgId}/cohorts/${cohortId}`);
  };

  const handleCreateCohort = () => {
    router.push(`/organizations/${orgId}/settings`);
  };

  const handleInviteUser = () => {
    router.push(`/organizations/${orgId}/settings`);
  };

  const handleSettings = () => {
    router.push(`/organizations/${orgId}/settings`);
  };

  // Navigate to a cohort
  const handleCohortClick = (cohortId: string) => {
    router.push(`/organizations/${orgId}/cohorts/${cohortId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <Header
          title={`Welcome, ${clerkUser?.firstName || 'Admin'}!`}
          subtitle="Here's what's happening in your organization"
        />

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New Course
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {cohorts.length > 0 ? (
                cohorts.map((cohort) => (
                  <DropdownMenuItem 
                    key={cohort.cohortId}
                    onClick={() => handleCreateCourseInCohort(cohort.cohortId)}
                  >
                    {cohort.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No cohorts available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" variant="outline" onClick={handleCreateCohort}>
            <GraduationCap className="mr-1 h-4 w-4" />
            New Cohort
          </Button>
          <Button size="sm" variant="outline" onClick={handleInviteUser}>
            <UserPlus className="mr-1 h-4 w-4" />
            Invite User
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSettings}>
            <Settings className="mr-1 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="mr-2 h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="cohorts">
            <GraduationCap className="mr-2 h-4 w-4" />
            Cohorts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                    <h3 className="text-2xl font-bold">{orgUsers.pagination.total}</h3>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cohorts</p>
                    <h3 className="text-2xl font-bold">{cohorts.length}</h3>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                    <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
                    <h3 className="text-2xl font-bold">{orgCourses.length}</h3>
                  </div>
                  <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900">
                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {courseCompletionStats.map((course) => (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {course.completedUsers} / {course.totalUsers} users completed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={course.averageProgress} 
                        className="h-2 flex-1 bg-slate-200" 
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {course.averageProgress}%
                      </span>
                    </div>
                  </div>
                ))}
                
                {courseCompletionStats.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No course progress data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Cohorts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cohorts.map(cohort => (
                  <div 
                    key={cohort.cohortId} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleCohortClick(cohort.cohortId)}
                  >
                    <div>
                      <h3 className="font-medium">{cohort.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cohort.courses?.length || 0} courses • {cohort.learners?.length || 0} learners
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
                
                {cohorts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No cohorts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
