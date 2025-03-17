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
  const { data: course, isLoading: courseLoading, refetch } = useGetCourseQuery(courseId);
  const { data: userProgress, isLoading: progressLoading } = useGetUserCourseProgressQuery({ userId: user?.id as string, courseId });

  const isLoading = courseLoading || progressLoading;

  const currentSection = course?.sections.find((s) => s.chapters.some((c) => c.chapterId === chapterId));

  const currentChapter = currentSection?.chapters.find((c) => c.chapterId === chapterId);

  const isChapterCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.sections) return false;

    const section = userProgress.sections.find((s) => s.sectionId === currentSection.sectionId);
    return (section?.chapters.some((c) => c.chapterId === currentChapter.chapterId && c.completed) ?? false);
  };

  const isQuizCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.sections) return false;

    const section = userProgress.sections.find((s) => s.sectionId === currentSection.sectionId);
    return (section?.chapters.some((c) => c.chapterId === currentChapter.chapterId && c.quizCompleted ) ?? false);
  }

  const isAssignmentsCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.sections) return false;

    const submissions = currentChapter?.assignments?.map((a) => a.submissions.some((s) => s.userId === user?.id));
    return submissions?.every((s) => s) ?? false;
  }

  const updateChapterProgress = (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => {
    if (!user) return;
    
    updateProgress({
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
    });
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
