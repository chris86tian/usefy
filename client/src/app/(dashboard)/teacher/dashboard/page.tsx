/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { 
  Users,
  BookOpen,
  GraduationCap,
  Activity,
  DollarSign
} from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useGetTransactionStatsQuery, useGetUsersQuery } from '@/state/api';

const AdminDashboard = () => {
  // Sample data - replace with real data from your backend
  const userActivityData = [
    { month: 'Jan', active: 400, new: 240, completed: 180 },
    { month: 'Feb', active: 450, new: 139, completed: 220 },
    { month: 'Mar', active: 520, new: 280, completed: 250 },
    { month: 'Apr', active: 590, new: 390, completed: 310 },
    { month: 'May', active: 620, new: 380, completed: 400 },
    { month: 'Jun', active: 700, new: 430, completed: 450 },
  ];

  const courseCompletionData = [
    { name: 'Completed', value: 540 },
    { name: 'In Progress', value: 320 },
    { name: 'Not Started', value: 140 },
  ];

  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0'];

  const topCoursesData = [
    { name: 'Web Development', enrolled: 245, revenue: 12250, completion: 85 },
    { name: 'Data Science', enrolled: 200, revenue: 10000, completion: 78 },
    { name: 'UI/UX Design', enrolled: 180, revenue: 9000, completion: 82 },
    { name: 'Mobile Development', enrolled: 160, revenue: 8000, completion: 75 },
    { name: 'Machine Learning', enrolled: 140, revenue: 7000, completion: 70 },
  ];

  const studentEngagementData = [
    { month: 'Jan', videos: 82, quizzes: 67, assignments: 45 },
    { month: 'Feb', videos: 85, quizzes: 72, assignments: 50 },
    { month: 'Mar', videos: 90, quizzes: 78, assignments: 55 },
    { month: 'Apr', videos: 87, quizzes: 75, assignments: 52 },
    { month: 'May', videos: 92, quizzes: 80, assignments: 58 },
    { month: 'Jun', videos: 95, quizzes: 85, assignments: 62 },
  ];

  const learningPathData = [
    { subject: 'Programming', score: 80 },
    { subject: 'Design', score: 65 },
    { subject: 'Database', score: 75 },
    { subject: 'DevOps', score: 70 },
    { subject: 'Soft Skills', score: 85 },
    { subject: 'Analytics', score: 60 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 15000, subscriptions: 120, courses: 80 },
    { month: 'Feb', revenue: 18000, subscriptions: 150, courses: 95 },
    { month: 'Mar', revenue: 22000, subscriptions: 180, courses: 110 },
    { month: 'Apr', revenue: 25000, subscriptions: 200, courses: 130 },
    { month: 'May', revenue: 28000, subscriptions: 220, courses: 150 },
    { month: 'Jun', revenue: 32000, subscriptions: 250, courses: 170 },
  ];

  const { data: transactionStats, isLoading: isTransactionLoading, isError: isTransactionError } = useGetTransactionStatsQuery();
  const { data: usersData, isLoading: isUsersLoading, isError: isUsersError } = useGetUsersQuery();

  return (
    <>
      <Header title="Dashboard" subtitle="Manage your platform effectively" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Link href={`/teacher/users`}>
          <Card className='bg-[#1e1e2e]'>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            {/* <CardContent>
              <div className="text-2xl font-bold">{usersData?.users.totalCount}</div>
              <p className="text-xs text-muted-foreground">+{usersData?.joinedLastMonth.length} joined last month</p>
            </CardContent> */}
          </Card>
        </Link>

        <Card className='bg-[#1e1e2e]'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82</div>
            <p className="text-xs text-muted-foreground">+12 new courses</p>
          </CardContent>
        </Card>

        <Card className='bg-[#1e1e2e]'> 
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>

        <Card className='bg-[#1e1e2e]'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,420</div>
            <p className="text-xs text-muted-foreground">+145 this week</p>
          </CardContent>
        </Card>

        <Card className='bg-[#1e1e2e]'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          {/* <CardContent>
            <div className="text-2xl font-bold">{transactionStats?.totalAmount}</div>
            <p className="text-xs text-muted-foreground">+{transactionStats?.percentageLastMonth}% this month</p>
          </CardContent> */}
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
            <CardDescription>Monthly revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="subscriptions" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="courses" 
                    stackId="3" 
                    stroke="#ffc658" 
                    fill="#ffc658" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Student Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Student Engagement</CardTitle>
            <CardDescription>Content interaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="videos" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quizzes" 
                    stroke="#82ca9d" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="assignments" 
                    stroke="#ffc658" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Learning Path Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Path Analysis</CardTitle>
            <CardDescription>Subject area performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={learningPathData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Course Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Course Completion Status</CardTitle>
            <CardDescription>Overall completion statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {courseCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Courses Performance */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Top Courses Performance</CardTitle>
            <CardDescription>Enrollment and revenue metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCoursesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="enrolled" 
                    fill="#2196F3" 
                    name="Enrolled Students" 
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="completion" 
                    fill="#4CAF50" 
                    name="Completion Rate %" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;