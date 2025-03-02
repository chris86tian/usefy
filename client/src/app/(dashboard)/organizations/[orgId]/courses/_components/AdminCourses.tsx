"use client";

import Header from "@/components/Header";
import { TeacherCourseCard } from "@/components/TeacherCourseCard";
import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useGetOrganizationCoursesQuery,
  useAddCourseToOrganizationMutation,
  useRemoveCourseFromOrganizationMutation,
} from "@/state/api";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { WandSparkles } from "lucide-react";
import { getUserName } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";
import { Spinner } from "@/components/ui/Spinner";
import { useOrganization } from "@/context/OrganizationContext";

const AdminCourses = () => {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useGetOrganizationCoursesQuery(currentOrg?.organizationId ?? "", {
    skip: !currentOrg,
  });
  const { user } = useUser();
  const isAdmin = currentOrg?.admins.some((admin) => admin.userId === user?.id);

  const [createCourse] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [archiveCourse] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();
  const [addCourse] = useAddCourseToOrganizationMutation();
  const [removeCourse] = useRemoveCourseFromOrganizationMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    return courses
      .filter((course) => {
        const matchesSearch = course.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (a.teacherId === user?.id && b.teacherId !== user?.id) return -1;
        if (a.teacherId !== user?.id && b.teacherId === user?.id) return 1;
        return 0;
      });
  }, [courses, searchTerm, selectedCategory, user?.id]);

  const handleEdit = (course: Course) => {
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/edit`, { scroll: false });
  };

  const handleStats = (course: Course) => {
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/stats`, { scroll: false });
  }

  const handleDelete = async (course: Course) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await removeCourse({
          organizationId: currentOrg?.organizationId ?? "",
          courseId: course.courseId
        }).unwrap();
        
        await deleteCourse(course.courseId).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete course:", error);
      }
    }
  };

  const handleArchive = async (course: Course) => {
    await archiveCourse(course.courseId).unwrap();
  }

  const handleUnarchive = async (course: Course) => {
    await unarchiveCourse(course.courseId).unwrap();
  }

  const handleGoToCourse = (course: Course) => {
    if (course.sections?.[0]?.chapters?.[0]) {
      router.push(
        `/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
        { scroll: false }
      );
    } else {
      router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}`, { scroll: false });
    }
  };

  const handleCreateCourse = async () => {
    if (!user) return;

    const result = await createCourse({
      teacherId: user.id,
      teacherName: getUserName(user as unknown as User),
    }).unwrap();

    await addCourse({
      organizationId: currentOrg?.organizationId ?? "",
      courseId: result.courseId,
    }).unwrap();
    
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${result.courseId}/edit`, { scroll: false });
  };

  if (isLoading) return <Spinner />;
  if (isError || !courses) 
    return (
      <div className="flex items-center justify-center h-[600px] text-gray-500">
        Error loading courses.
      </div>
    );

  return (
    <div className="space-y-6">
      <Header
        title="Courses Management"
        subtitle="Manage your organization's courses"
        rightElement={
          <Button
            onClick={handleCreateCourse}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <WandSparkles className="w-5 h-5" />
            Create Course
          </Button>
        }
      />
      <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <TeacherCourseCard
            key={course.courseId}
            course={course}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isOwner={course.teacherId === user?.id || !!isAdmin}
            onView={handleGoToCourse}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onStats={handleStats}
          />
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] text-gray-500">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;