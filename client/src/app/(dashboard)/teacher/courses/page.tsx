"use client";

import Header from "@/components/Header";
import CoursesSkeleton from "./_components/CoursesSkeleton";
import TeacherCourseCard from "@/components/TeacherCourseCard";
import Toolbar from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
} from "@/state/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

const Courses = () => {
  const router = useRouter();
  const { user } = useUser();
  const {
    data: courses,
    isLoading,
    isError,
  } = useGetCoursesQuery({ category: "all" });

  const [createCourse] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [archiveCourse] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();

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
    router.push(`/teacher/courses/${course.courseId}`, { scroll: false });
  };

  const handleDelete = async (course: Course) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      await deleteCourse(course.courseId).unwrap();
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
        `/user/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
        { scroll: false }
      );
    } else {
      router.push(`/user/courses/${course.courseId}`, { scroll: false });
    }
  };

  const handleCreateCourse = async () => {
    if (!user) return;

    const result = await createCourse({
      teacherId: user.id,
      teacherName: user.fullName || "Unknown Teacher",
    }).unwrap();
    router.push(`/teacher/courses/${result.courseId}`, { scroll: false });
  };

  if (isLoading) return <CoursesSkeleton />;
  if (isError || !courses) 
    return (
      <div className="flex items-center justify-center h-[600px] text-gray-500">
        Error loading courses.
      </div>
    );

  return (
    <div className="teacher-courses space-y-8">
      <Header
        title="Courses"
        subtitle="Browse your courses"
        rightElement={
          <Button
            onClick={handleCreateCourse}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Create Course
          </Button>
        }
      />
      <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course: Course) => (
          <TeacherCourseCard
            key={course.courseId}
            course={course}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isOwner={course.teacherId === user?.id}
            onView={handleGoToCourse}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
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

export default Courses;