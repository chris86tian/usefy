"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookCopyIcon, Users } from 'lucide-react';
import { getUserName, handleEnroll } from "@/lib/utils";
import { CourseCard } from "@/components/CourseCard";
import { Toolbar } from "@/components/Toolbar";
import { useRouter } from "next/navigation";
import type { User } from "@clerk/nextjs/server";
import ManageUsersDialog from "./ManageUsersDialog";
import Header from "@/components/Header";
import { useUser } from "@clerk/nextjs";
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
import {
  useAddCourseToCohortMutation,
  useRemoveCourseFromCohortMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useCreateTransactionMutation,
  useUnenrollUserMutation,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useCreateCourseMutation,
} from "@/state/api";

interface CohortCoursesProps {
  cohort: Cohort;
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] };
  courses: Course[];
  refetch: () => void;
}

const CohortCourses = ({
  cohort,
  orgUsers,
  courses,
  refetch,
}: CohortCoursesProps) => {
  const { user } = useUser();
  const currentUserId = user?.id;
  const router = useRouter();

  const [createCourse, { isLoading: createCourseLoading }] =
    useCreateCourseMutation();
  const [addCourseToCohort, { isLoading: addCourseLoading }] =
    useAddCourseToCohortMutation();
  const [removeCourseFromCohort, { isLoading: removeCourseLoading }] =
    useRemoveCourseFromCohortMutation();
  const [addCourseInstructor, { isLoading: addInstructorLoading }] =
    useAddCourseInstructorMutation();
  const [removeCourseInstructor, { isLoading: removeInstructorLoading }] =
    useRemoveCourseInstructorMutation();
  const [createTransaction, { isLoading: createTransactionLoading }] =
    useCreateTransactionMutation();
  const [unenrollUser, { isLoading: unenrollLoading }] =
    useUnenrollUserMutation();
  const [archiveCourse, { isLoading: archiveCourseLoading }] =
    useArchiveCourseMutation();
  const [unarchiveCourse, { isLoading: unarchiveCourseLoading }] =
    useUnarchiveCourseMutation();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [activeDialog, setActiveDialog] = useState<
    "none" | "addCourse" | "manageInstructors" | "manageUsers"
  >("none");
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isManageUsersDialogOpen, setIsManageUsersDialogOpen] = useState(false);
  const [selectedCourseForUsers, setSelectedCourseForUsers] =
    useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const REMOVE_INSTRUCTOR = "remove_instructor";

  const filteredCourses = useMemo(() => {
    console.log("Filtering courses:", courses);
    if (!courses) return [];

    // Filter out null courses and log them
    const validCourses = courses.filter((course) => {
      if (!course) {
        console.log("Found null course in courses array");
        return false;
      }

      if (typeof course !== "object" || !course.courseId || !course.title) {
        console.log("Invalid course object:", course);
        return false;
      }

      return true;
    });

    console.log(
      `Valid courses: ${validCourses.length} out of ${courses.length}`
    );

    return validCourses
      .filter((course) => {
        const matchesSearch =
          course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false;
        return matchesSearch;
      })
      .sort((a, b) => {
        const isUserInstructorA = a.instructors?.some(
          (instructor) => instructor.userId === currentUserId
        );
        const isUserInstructorB = b.instructors?.some(
          (instructor) => instructor.userId === currentUserId
        );
        if (isUserInstructorA && !isUserInstructorB) return -1;
        if (!isUserInstructorA && isUserInstructorB) return 1;
        return 0;
      });
  }, [courses, searchTerm, currentUserId]);

  const handleCreateCourse = async () => {
    try {
      const newCourse = await createCourse();
      await addCourseToCohort({
        organizationId: cohort.organizationId,
        cohortId: cohort.cohortId,
        courseId: newCourse.data?.courseId as string,
      });
      router.push(
        `/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${newCourse.data?.courseId}/edit`
      );
      refetch();
    } catch (error) {
      toast.error("Failed to create course");
    }
  };

  const handleAddCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    try {
      await addCourseToCohort({
        organizationId: cohort.organizationId,
        cohortId: cohort.cohortId,
        courseId: selectedCourseId,
      });

      if (selectedInstructorId) {
        await addCourseInstructor({
          courseId: selectedCourseId,
          userId: selectedInstructorId,
        });

        handleEnroll(selectedInstructorId, selectedCourseId, createTransaction);
      }

      toast.success("Course added to cohort successfully");
      setActiveDialog("none");
      setSelectedCourseId("");
      setSelectedInstructorId("");
      refetch();
    } catch (error) {
      toast.error("Failed to add course to cohort");
      setActiveDialog("none");
      setSelectedCourseId("");
      setSelectedInstructorId("");
    }
  };

  const openManageInstructorsDialog = (course: Course) => {
    setCourseToEdit(course);
    setSelectedInstructorId(
      course.instructors && course.instructors.length > 0
        ? course.instructors[0].userId
        : ""
    );
    setActiveDialog("manageInstructors");
  };

  const openManageUsersDialog = (course: Course) => {
    setSelectedCourseForUsers(course);
    setIsManageUsersDialogOpen(true);
  };

  const handleManageInstructors = async () => {
    if (!courseToEdit) {
      toast.error("No course selected");
      return;
    }

    const hasCurrentInstructor =
      courseToEdit.instructors && courseToEdit.instructors.length > 0;
    const isRemovingInstructor =
      hasCurrentInstructor && selectedInstructorId === REMOVE_INSTRUCTOR;

    try {
      if (hasCurrentInstructor) {
        await removeCourseInstructor({
          courseId: courseToEdit.courseId,
          userId: courseToEdit?.instructors?.[0].userId as string,
        });

        await unenrollUser({
          courseId: courseToEdit.courseId,
          userId: courseToEdit?.instructors?.[0].userId as string,
        });
      }

      if (selectedInstructorId && selectedInstructorId !== REMOVE_INSTRUCTOR) {
        await addCourseInstructor({
          courseId: courseToEdit.courseId,
          userId: selectedInstructorId,
        });

        handleEnroll(
          selectedInstructorId,
          courseToEdit.courseId,
          createTransaction
        );
      }

      if (!hasCurrentInstructor && !selectedInstructorId) {
        toast.error("Please select an instructor");
        return;
      }

      toast.success(
        isRemovingInstructor
          ? "Instructor removed successfully"
          : "Course instructor updated successfully"
      );
      closeAllDialogs();
      refetch();
    } catch (error) {
      toast.error(
        isRemovingInstructor
          ? "Failed to remove instructor"
          : "Failed to update course instructor"
      );
      closeAllDialogs();
    }
  };

  const closeAllDialogs = () => {
    setActiveDialog("none");
    setCourseToEdit(null);
    setSelectedInstructorId("");
  };

  const handleEdit = (course: Course) => {
    router.push(
      `/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${course.courseId}/edit`,
      {
        scroll: false,
      }
    );
  };

  const handleStats = (course: Course) => {
    router.push(
      `/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${course.courseId}/stats`,
      {
        scroll: false,
      }
    );
  };

  const handleDeleteConfirmation = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await removeCourseFromCohort({
        organizationId: cohort.organizationId,
        cohortId: cohort.cohortId,
        courseId: courseToDelete.courseId,
      });
      refetch();
    } catch (error) {
      toast.error("Failed to remove course from cohort");
    } finally {
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleArchive = async (course: Course) => {
    try {
      await archiveCourse(course.courseId).unwrap();
      toast.success(`Course "${course.title}" archived`);
      refetch();
    } catch (error) {
      toast.error("Failed to archive course");
    }
  };

  const handleUnarchive = async (course: Course) => {
    try {
      await unarchiveCourse(course.courseId).unwrap();
      toast.success(`Course "${course.title}" unarchived`);
      refetch();
    } catch (error) {
      toast.error("Failed to unarchive course");
    }
  };

  const handleGoToCourse = (course: Course) => {
    if (course.sections?.[0]?.chapters?.[0]) {
      router.push(
        `/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`,
        { scroll: false }
      );
    } else {
      router.push(
        `/organizations/${cohort?.organizationId}/cohorts/${cohort?.cohortId}/courses/${course.courseId}`,
        {
          scroll: false,
        }
      );
    }
  };

  const handleCourseEnroll = (course: Course) => {
    if (!user) {
      toast.error("You must be logged in to enroll in courses");
      return;
    }

    const isEnrolled = course.enrollments?.some(
      (enrollment) => enrollment.userId === user.id
    );

    if (!isEnrolled) {
      setEnrollingCourseId(course.courseId);
      handleEnroll(user.id, course.courseId, createTransaction)
        .then(() => {
          toast.success(`Successfully enrolled in ${course.title}`);
          if (
            course.sections &&
            course.sections.length > 0 &&
            course.sections[0].chapters.length > 0
          ) {
            router.push(
              `/organizations/${cohort.organizationId}/cohorts/${cohort.cohortId}/courses/${course.courseId}/chapters/${course.sections[0].chapters[0].chapterId}`
            );
          }
          refetch();
          setEnrollingCourseId(null);
        })
        .catch((error) => {
          console.error("Enrollment error:", error);
          toast.error("Failed to enroll in course");
          setEnrollingCourseId(null);
        });
    } else {
      toast.info("You are already enrolled in this course");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Toolbar onSearch={setSearchTerm} />
        <Button
          onClick={handleCreateCourse}
          disabled={createCourseLoading || addCourseLoading}
        >
          <BookCopyIcon className="mr-2 h-4 w-4" />
          {createCourseLoading || addCourseLoading
            ? "Creating..."
            : "Create Course"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.courseId}
              course={course}
              variant="admin"
              isEnrolled={course.enrollments?.some((enrollment) => enrollment.userId === currentUserId)}
              onEnroll={handleCourseEnroll}
              isEnrolling={enrollingCourseId === course.courseId}
              onEdit={handleEdit}
              onDelete={handleDeleteConfirmation}
              onView={handleGoToCourse}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onStats={handleStats}
              customActions={[
                {
                  label: "Manage Instructors",
                  icon: <Users className="h-4 w-4 mr-2" />,
                  onClick: () => openManageInstructorsDialog(course),
                },
                {
                  label: "Manage Enrollments",
                  icon: <Users className="h-4 w-4 mr-2" />,
                  onClick: () => openManageUsersDialog(course),
                },
              ]}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] text-gray-500">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">
              Try adjusting your search or add courses to this cohort
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={activeDialog === "manageInstructors"}
        onOpenChange={(open) => !open && closeAllDialogs()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Course Instructors</DialogTitle>
            <DialogDescription>
              {courseToEdit?.instructors &&
              courseToEdit.instructors.length > 0 &&
              courseToEdit
                ? (() => {
                    const instructorId = courseToEdit.instructors[0].userId;
                    const instructorData = orgUsers.instructors.find(
                      (i) => i.id === instructorId
                    );

                    return `Current instructor: ${instructorData ? getUserName(instructorData) : instructorId}`;
                  })()
                : "No instructor currently assigned"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Select Instructor</Label>
              <Select
                value={selectedInstructorId}
                onValueChange={setSelectedInstructorId}
              >
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="Select instructor">
                    {selectedInstructorId === REMOVE_INSTRUCTOR
                      ? "Remove instructor"
                      : selectedInstructorId
                        ? (() => {
                            const instructor = orgUsers.instructors.find(
                              (i) => i.id === selectedInstructorId
                            );
                            return instructor
                              ? getUserName(instructor)
                              : selectedInstructorId;
                          })()
                        : "Select instructor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courseToEdit?.instructors &&
                    courseToEdit.instructors.length > 0 && (
                      <SelectItem value={REMOVE_INSTRUCTOR}>
                        <span className="text-destructive">
                          Remove instructor
                        </span>
                      </SelectItem>
                    )}
                  {orgUsers.instructors.length > 0 ? (
                    orgUsers.instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        <span className="flex flex-col">
                          <span>{getUserName(instructor)}</span>
                          <span className="text-xs text-muted-foreground">
                            {instructor.emailAddresses[0].emailAddress}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground">
                      No instructors found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleManageInstructors}
              disabled={removeInstructorLoading || addInstructorLoading}
              variant={
                selectedInstructorId === REMOVE_INSTRUCTOR
                  ? "destructive"
                  : "default"
              }
            >
              {selectedInstructorId === REMOVE_INSTRUCTOR
                ? "Remove Instructor"
                : courseToEdit?.instructors &&
                    courseToEdit.instructors.length > 0
                  ? "Change Instructor"
                  : "Assign Instructor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageUsersDialog
        isOpen={isManageUsersDialogOpen}
        onClose={() => {
          setIsManageUsersDialogOpen(false);
          setSelectedCourseForUsers(null);
        }}
        course={selectedCourseForUsers}
        cohortLearners={orgUsers.learners}
        onSuccess={() => {
          refetch();
          setSelectedCourseForUsers(null);
          setIsManageUsersDialogOpen(false);
        }}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the course
              {courseToDelete && ` "${courseToDelete.title}"`} from this cohort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeCourseLoading}
              onClick={handleDeleteCourse}
              className="bg-red-500 hover:bg-red-600"
            >
              {removeCourseLoading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
       
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CohortCourses;
