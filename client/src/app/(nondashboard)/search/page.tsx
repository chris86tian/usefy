"use client";

import Loading from "@/components/Loading";
import { useGetCoursesQuery } from "@/state/api";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CourseCardSearch from "@/components/CourseCardSearch";
import SelectedCourse from "./SelectedCourse";
import { useUser } from "@clerk/nextjs";
import { SquareStack } from "lucide-react";

const Search = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { data: courses, isLoading, isError } = useGetCoursesQuery({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const router = useRouter();
  const user = useUser();

  const publishedCourses = React.useMemo(() => {
    return courses?.filter(course => course.status === "Published") || [];
  }, [courses]);

  useEffect(() => {
    if (publishedCourses.length > 0) {
      if (id) {
        const course = publishedCourses.find((c) => c.courseId === id);
        setSelectedCourse(course || publishedCourses[0]);
      } else {
        setSelectedCourse(publishedCourses[0]);
      }
    }
  }, [publishedCourses, id]);

  if (isLoading) return <Loading />;
  if (isError || !courses) return <div>Failed to fetch courses</div>;

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    router.push(`/search?id=${course.courseId}`, {
      scroll: false,
    });
  };

  const handleEnrollNow = (courseId: string) => {
    router.push(`/checkout?step=1&id=${courseId}&showSignUp=false`, {
      scroll: false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search"
    >
      <h1 className="search__title">List of available courses</h1>
      <h2 className="search__subtitle">{publishedCourses.length} courses available</h2>
      <div className="search__content">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="search__courses-grid"
        >
          {publishedCourses.length > 0 ? (
            publishedCourses.map((course) => (
              <CourseCardSearch
                key={course.courseId}
                course={course}
                isSelected={selectedCourse?.courseId === course.courseId}
                onClick={() => handleCourseSelect(course)}
              />
            ))
          ) : (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <SquareStack className="w-24 h-24 text-gray-400" />
              <p className="text-center text-gray-600">
                No courses available at the moment.
                <br />
                Please check back later.
              </p>
            </div>
          )}
        </motion.div>

        {selectedCourse && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="search__selected-course"
          >
            <SelectedCourse
              course={selectedCourse}
              handleEnrollNow={handleEnrollNow}
              userId={user.user?.id || ""}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;