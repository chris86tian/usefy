import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useGetCourseQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
  useGetCourseInstructorsQuery,
} from "@/state/api";
import { useUser } from "@clerk/nextjs";

export const useCourseProgressData = () => {
  const { user } = useUser();
  const { courseId, chapterId } = useParams() as { courseId: string; chapterId: string };
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [updateProgress] = useUpdateUserCourseProgressMutation();

  const { data: courseInstructors } = useGetCourseInstructorsQuery(courseId);
  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useGetCourseQuery(courseId);
  const { 
    data: userProgress, 
    isLoading: progressLoading, 
    refetch: refetchProgress 
  } = useGetUserCourseProgressQuery(
    { userId: user?.id as string, courseId },
    { skip: !user?.id }
  );

  const isChapterCompleted = (sectionId: string, chapterId: string) => {
    const section = userProgress?.sections?.find((s) => s.sectionId === sectionId);
    return section?.chapters.some((c) => c.chapterId === chapterId && c.completed) ?? false;
  };

  const isLoading = courseLoading || progressLoading;
  const currentSection = course?.sections.find((s) => s.chapters.some((c) => c.chapterId === chapterId));
  const currentChapter = currentSection?.chapters.find((c) => c.chapterId === chapterId);
  
  const isQuizCompleted = (chapterId: string) => {
    if (!userProgress?.sections) return false;
    
    const sectionWithChapter = userProgress.sections.find(section => 
      section.chapters.some(chapter => chapter.chapterId === chapterId)
    );
    
    if (!sectionWithChapter) return false;
    
    return sectionWithChapter.chapters.some(
      chapter => chapter.chapterId === chapterId && chapter.quizCompleted
    );
  };

  const isAssignmentsCompleted = (chapterId: string) => {
    if (!course?.sections) return false;
    
    // Find the section containing this chapter
    const section = course.sections.find(section => 
      section.chapters.some(chapter => chapter.chapterId === chapterId)
    );
    
    if (!section) return false;
    
    // Find the chapter
    const chapter = section.chapters.find(c => c.chapterId === chapterId);
    
    if (!chapter || !chapter.assignments || chapter.assignments.length === 0) return false;
    
    // Check if all assignments have submissions from this user
    return chapter.assignments.every(assignment => 
      assignment.submissions?.some(submission => submission.userId === user?.id)
    );
  };

  const updateChapterProgress = async (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => {
    if (!user) return;
    
    try {
      await updateProgress({
        userId: user.id,
        courseId,
        progressData: {
          sections: [
            {
              sectionId,
              chapters: [
                {
                  chapterId,
                  completed,
                },
              ],
            },
          ],
        },
      }).unwrap(); // Using unwrap() to get the result or throw an error
      
      // After successful update, refetch the progress data
      await refetchProgress();
      
      // Update local state if needed
      setHasMarkedComplete(completed);
    } catch (error) {
      console.error("Failed to update chapter progress:", error);
    }
  };

  // Function to refetch all data
  const refetch = async () => {
    await Promise.all([refetchCourse(), refetchProgress()]);
  };

  return {
    user,
    courseId,
    chapterId,
    course,
    courseInstructors,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    isQuizCompleted,
    isAssignmentsCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
    refetch,
  };
};