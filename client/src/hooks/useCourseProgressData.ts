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


  const isChapterCompleted = (sectionId: string, chapterId: string) => {
    const section = userProgress?.sections?.find((s) => s.sectionId === sectionId);
    return section?.chapters.some((c) => c.chapterId === chapterId && c.completed) ?? false;
  };

  const isLoading = courseLoading || progressLoading;
  const currentSection = course?.sections.find((s) => s.chapters.some((c) => c.chapterId === chapterId));
  const currentChapter = currentSection?.chapters.find((c) => c.chapterId === chapterId);
  

  const isQuizCompleted = (targetChapterId?: string) => {
    const chapterToCheck = targetChapterId || currentChapter?.chapterId;
    
    if (!chapterToCheck || !userProgress?.sections) return false;
    
    // Find the section and chapter
    const targetChapter = course?.sections
      .flatMap(s => s.chapters)
      .find(c => c.chapterId === chapterToCheck);
      
    const targetSection = course?.sections
      .find(s => s.chapters.some(c => c.chapterId === chapterToCheck));
    
    // If there's no quiz in the chapter, consider it completed
    if (!targetChapter || targetChapter.quiz === undefined) return true;

    // Find the section in user progress
    const section = userProgress.sections.find((s) => s.sectionId === targetSection?.sectionId);
    return (section?.chapters.some((c) => c.chapterId === chapterToCheck && c.quizCompleted) ?? false);
  }

  const isAssignmentsCompleted = (targetChapterId?: string) => {
    const chapterToCheck = targetChapterId || currentChapter?.chapterId;
    
    if (!chapterToCheck || !userProgress?.sections) return false;
    
    // Find the chapter
    const targetChapter = course?.sections
      .flatMap(s => s.chapters)
      .find(c => c.chapterId === chapterToCheck);
    
    // If there are no assignments in the chapter, consider them completed
    if (!targetChapter || !targetChapter.assignments || targetChapter.assignments.length === 0) return true;

    // Check if all assignments have submissions from the current user
    const submissions = targetChapter.assignments.map((a) => 
      a.submissions?.some((s) => s.userId === user?.id)
    );
    
    return submissions.every((s) => s === true);
  }

  const updateChapterProgress = (
    sectionId: string,
    chapterId: string,
    completed: boolean,
    quizCompleted?: boolean
  ) => {
    if (!user) return;
    
    const progressData: any = {
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
    };

    // Only include quizCompleted if it's provided
    if (quizCompleted !== undefined) {
      progressData.sections[0].chapters[0].quizCompleted = quizCompleted;
    }

    updateProgress({
      userId: user.id,
      courseId,
      progressData,
    });
  };

  const markQuizCompleted = (targetChapterId?: string) => {
    const chapterToCheck = targetChapterId || currentChapter?.chapterId;
    
    if (!chapterToCheck || !user) return;
    
    // Find the section for the chapter
    const targetSection = course?.sections
      .find(s => s.chapters.some(c => c.chapterId === chapterToCheck));
    
    if (!targetSection) return;
    
    updateChapterProgress(
      targetSection.sectionId,
      chapterToCheck,
      true, // Mark chapter as completed
      true  // Mark quiz as completed
    );
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
    markQuizCompleted,
    hasMarkedComplete,
    setHasMarkedComplete,
    refetch,
  };
};
