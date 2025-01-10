"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useGetUserEnrolledCoursesQuery } from "@/state/api";
import Header from "@/components/Header";
import Toolbar from "@/components/Toolbar";
import CourseCard from "@/components/CourseCard";
import { CoursesSkeleton } from "./_components/CoursesSkeleton";
import { CoursesEmpty } from "./_components/CoursesEmpty";
import { CoursesError } from "./_components/CoursesError";
import { SignInRequired } from "@/components/SignInRequired";

const Courses: React.FC = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    data: courses,
    isLoading,
    isError,
  } = useGetUserEnrolledCoursesQuery(user?.id ?? "", {
    skip: !isLoaded || !user,
  });

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  const handleGoToCourse = (course: Course) => {
    if (
      course.sections &&
      course.sections.length > 0 &&
      course.sections[0].chapters.length > 0
    ) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(
        `/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`,
        {
          scroll: false,
        }
      );
    } else {
      router.push(`/user/courses/${course.courseId}`, {
        scroll: false,
      });
    }
  };

  if (!isLoaded || isLoading) return <CoursesSkeleton />;

  if (!user) return <SignInRequired />;
  
  if (isError) return <CoursesError />;

  if (!courses || courses.length === 0) return <CoursesEmpty />;

  return (
    <div className="user-courses text-[#e6e6e6] min-h-screen p-6">
      <Header title="My Courses" subtitle="View your enrolled courses" />
      <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      {filteredCourses.length === 0 ? (
        <CoursesEmpty searchTerm={searchTerm} selectedCategory={selectedCategory} />
      ) : (
        <div className="user-courses__grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.courseId}
              course={course}
              onGoToCourse={handleGoToCourse}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
