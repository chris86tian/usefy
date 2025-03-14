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
  const { courseId, chapterId } = useParams();
  const { user } = useUser();
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [updateProgress] = useUpdateUserCourseProgressMutation();

  const { data: courseInstructors } = useGetCourseInstructorsQuery((courseId as string) ?? "", { skip: !courseId});
  const { data: course, isLoading: courseLoading } = useGetCourseQuery((courseId as string) ?? "", { skip: !courseId });
  const { data: userProgress, isLoading: progressLoading } = useGetUserCourseProgressQuery({ userId: user?.id ?? "", courseId: (courseId as string) ?? "" },{ skip: !user || !courseId });

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
      courseId: (courseId as string) ?? "",
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
  };
};
