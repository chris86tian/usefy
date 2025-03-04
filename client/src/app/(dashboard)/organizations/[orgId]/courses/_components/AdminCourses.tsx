"use client";

import Header from "@/components/Header";
import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import {
  useCreateCourseMutation,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useGetOrganizationCoursesQuery,
  useAddCourseToOrganizationMutation,
  useRemoveCourseFromOrganizationMutation,
} from "@/state/api";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { WandSparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/Spinner";
import { useOrganization } from "@/context/OrganizationContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CourseCard from "@/components/CourseCard";

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
  const [archiveCourse] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();
  const [addCourse] = useAddCourseToOrganizationMutation();
  const [removeCourseFromOrganization] = useRemoveCourseFromOrganizationMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
        const isUserInstructorA = a.instructors?.some(instructor => instructor.userId === user?.id);
        const isUserInstructorB = b.instructors?.some(instructor => instructor.userId === user?.id);
        if (isUserInstructorA && !isUserInstructorB) return -1;
        if (!isUserInstructorA && isUserInstructorB) return 1;
        return 0;
      });
  }, [courses, searchTerm, selectedCategory, user?.id]);

  const handleEdit = (course: Course) => {
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/edit`, { scroll: false });
  };

  const handleStats = (course: Course) => {
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/stats`, { scroll: false });
  }

  const handleDeleteConfirmation = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      await removeCourseFromOrganization({
        organizationId: currentOrg?.organizationId ?? "",
        courseId: courseToDelete.courseId
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete course:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
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

    const result = await createCourse().unwrap();

    await addCourse({
      organizationId: currentOrg?.organizationId ?? "",
      courseId: result.courseId,
    }).unwrap();
    
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${result.courseId}/edit`, { scroll: false });
  };

  if (isLoading) return <Spinner />;


  return (
    <div className="space-y-6">
      <Header
        title="Courses Management"
        subtitle="Manage your organization's courses"
        rightElement={
          isAdmin ? (
            <Button
              onClick={handleCreateCourse}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <WandSparkles className="w-5 h-5" />
              Create Course
            </Button>
          ) : null
        }
      />
      <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.courseId}
            course={course}
            variant="admin"
            onEdit={handleEdit}
            onDelete={handleDeleteConfirmation}
            isOwner={!!isAdmin}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              {courseToDelete && ` "${courseToDelete.title}"`} and remove it from the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCourses;