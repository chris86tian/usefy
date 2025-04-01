"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInRequired } from "@/components/SignInRequired";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/Spinner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { 
  Users, 
  BookOpen,
  GraduationCap,
  BarChart3,
  Calendar,
  ClipboardList,
  ChevronRight
} from "lucide-react";
import { 
  useGetOrganizationCoursesQuery,
  useGetCohortsQuery,
  useGetMyUserCourseProgressesQuery
} from '@/state/api';
import Header from '@/components/Header';

interface UserDashboardProps {
  orgId: string;
}

const UserDashboard = ({ orgId }: UserDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useUser();
  const router = useRouter();

  // Fetch user's courses in this organization
  const { 
    data: orgCourses = [],
    isLoading: coursesLoading 
  } = useGetOrganizationCoursesQuery(orgId);

  // Fetch user's cohorts in this organization
  const {
    data: allCohorts = [],
    isLoading: cohortsLoading,
  } = useGetCohortsQuery(orgId);

  // Filter cohorts to only include those where the user is a learner
  const cohorts = allCohorts.filter(cohort => 
    cohort.learners && cohort.learners.some(learner => 
      user?.id && learner.userId === user.id
    )
  );

  console.log(cohorts[0].courses);

  // Fetch user's course progress data
  const {
    data: progressData = [],
    isLoading: progressLoading,
  } = useGetMyUserCourseProgressesQuery(orgId);

  if (!user) return <SignInRequired />;

  if (coursesLoading || cohortsLoading || progressLoading) {
    return <Spinner />;
  }

  // Get courses with progress data
  const coursesWithProgress = orgCourses.map(course => {
    const progress = progressData.find(p => p.courseId === course.courseId);
    return {
      ...course,
      progress: progress?.overallProgress || 0,
      lastAccessed: null // Simplified to avoid type errors
    };
  });

  // Sort courses by progress (in-progress first, then not started, then completed)
  const sortedCourses = [...coursesWithProgress].sort((a, b) => {
    // In progress courses first (progress > 0 but < 100)
    if (a.progress > 0 && a.progress < 100 && (b.progress === 0 || b.progress === 100)) return -1;
    if (b.progress > 0 && b.progress < 100 && (a.progress === 0 || a.progress === 100)) return 1;
    
    // Not started courses next (progress === 0)
    if (a.progress === 0 && b.progress > 0) return -1;
    if (b.progress === 0 && a.progress > 0) return 1;
    
    // Sort by progress percentage
    return b.progress - a.progress;
  });

  // Get the first chapter of a course for navigation
  const getFirstChapterLink = (courseId: string) => {
    const course = orgCourses.find(c => c.courseId === courseId);
    if (!course) return `/organizations/${orgId}/courses/${courseId}`;
    
    // Find the cohort that contains this course
    const cohort = cohorts.find(c => 
      c.courses && c.courses.some(courseCohort => courseCohort.courseId === courseId)
    );
    
    const cohortId = cohort?.cohortId || 'default';
    
    if (course.sections?.[0]?.chapters?.[0]?.chapterId) {
      return `/organizations/${orgId}/cohorts/${cohortId}/courses/${courseId}/chapters/${course.sections[0].chapters[0].chapterId}`;
    }
    return `/organizations/${orgId}/cohorts/${cohortId}/courses/${courseId}`;
  };

  // Navigate to a course
  const handleCourseClick = (courseId: string) => {
    const link = getFirstChapterLink(courseId);
    if (progressData.find(p => p.courseId === courseId)) {
      router.push(link);
    } else {
      const cohort = cohorts.find(c => 
        c.courses && c.courses.some(courseCohort => courseCohort.courseId === courseId)
      );
      const cohortId = cohort?.cohortId || 'default';
      router.push(`/organizations/${orgId}/cohorts/${cohortId}`);
    }
  };

  // Navigate to a cohort
  const handleCohortClick = (cohortId: string) => {
    router.push(`/organizations/${orgId}/cohorts/${cohortId}`);
  };

  return (
    <div className="space-y-6">
      <Header
        title={`Welcome, ${user.firstName || 'User'}!`}
        subtitle="Track your learning progress"
      />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="mr-2 h-4 w-4" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="cohorts">
            <GraduationCap className="mr-2 h-4 w-4" />
            My Cohorts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">My Courses</p>
                    <h3 className="text-2xl font-bold">{coursesWithProgress.length}</h3>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">My Cohorts</p>
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
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Courses</p>
                    <h3 className="text-2xl font-bold">
                      {coursesWithProgress.filter(c => c.progress === 100).length}
                    </h3>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                    <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* In Progress Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Courses In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedCourses
                  .filter(course => course.progress > 0 && course.progress < 100)
                  .slice(0, 3)
                  .map(course => (
                    <div key={course.courseId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{course.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCourseClick(course.courseId)}
                        >
                          Continue
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={course.progress} 
                          className="h-2 flex-1 bg-slate-200" 
                        />
                        <span className="text-sm font-medium w-12 text-right">
                          {course.progress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                
                {sortedCourses.filter(course => course.progress > 0 && course.progress < 100).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No courses in progress
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedCourses.map(course => (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{course.title}</span>
                        {course.progress === 100 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                            Completed
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCourseClick(course.courseId)}
                      >
                        {course.progress > 0 ? 'Continue' : 'Enroll'}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={course.progress} 
                        className="h-2 flex-1 bg-slate-200" 
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                ))}
                
                {sortedCourses.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    You are not enrolled in any courses yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Cohorts</CardTitle>
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
                        {cohort.courses?.length || 0} courses
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
                
                {cohorts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    You are not a member of any cohorts yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;