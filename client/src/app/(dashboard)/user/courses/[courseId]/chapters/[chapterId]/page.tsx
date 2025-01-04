'use client';

import React, { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactPlayer from "react-player";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { BookOpen, FileText, GraduationCap } from "lucide-react";
import AssignmentModal from "./_components/assignmentModal";
import Assignments from "./assignments/page";

const Course = () => {
  const {
    user,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
  } = useCourseProgressData();

  const playerRef = useRef(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleProgress = ({ played }: { played: number }) => {
    if (
      played >= 0.8 &&
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted()
    ) {
      setHasMarkedComplete(true);
      updateChapterProgress(
        currentSection.sectionId,
        currentChapter.chapterId,
        true
      );
    }
  };

  const handleGoToPreviousChapter = () => {
    const previousChapterIndex = (currentSection?.chapters?.findIndex(
      (chapter) => chapter.chapterId === currentChapter?.chapterId
    ) ?? -1) - 1;
    if (previousChapterIndex >= 0 && course) {
      router.push(`/user/courses/${course.courseId}/chapters/${currentSection?.chapters[previousChapterIndex].chapterId}`);
    } else {
      const previousSectionIndex = (course?.sections?.findIndex(
        (section) => section.sectionId === currentSection?.sectionId
      ) ?? -1) - 1;
      if (course?.sections && previousSectionIndex >= 0) {
        const previousSection = course.sections[previousSectionIndex];
        router.push(`/user/courses/${course.courseId}/chapters/${previousSection.chapters[previousSection.chapters.length - 1].chapterId}`);
      }
    }
  };

  const handleGoToNextChapter = () => {
    const nextChapterIndex = (currentSection?.chapters?.findIndex(
      (chapter) => chapter.chapterId === currentChapter?.chapterId
    ) ?? -1) + 1;
    if (currentSection?.chapters && nextChapterIndex < currentSection.chapters.length && course) {
      router.push(`/user/courses/${course.courseId}/chapters/${currentSection?.chapters[nextChapterIndex].chapterId}`);
    } else {
      const nextSectionIndex = (course?.sections?.findIndex(
        (section) => section.sectionId === currentSection?.sectionId
      ) ?? -1) + 1;
      if (course?.sections && nextSectionIndex < course.sections.length) {
        router.push(`/user/courses/${course.courseId}/chapters/${course.sections[nextSectionIndex].chapters[0].chapterId}`);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  if (isLoading) return <Loading />;
  if (!user) return <div className="p-4 text-center">Please sign in to view this course.</div>;
  if (!course || !userProgress || !currentChapter) return <div className="p-4 text-center">Error loading course</div>;

  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{course.title}</span>
          <span>/</span>
          <span>{currentSection?.sectionTitle}</span>
          <span>/</span>
          <span className="font-medium text-foreground">{currentChapter?.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{currentChapter?.title}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{course.teacherName}</span>
          </div>
        </div>
      </div>

      <Card className="course__video">
        <CardContent className="course__video-container">
          {currentChapter?.video ? (
            <ReactPlayer
              ref={playerRef}
              url={currentChapter.video as string}
              controls
              width="100%"
              height="100%"
              onProgress={handleProgress}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                  },
                },
              }}
            />
          ) : (
            <div className="course__no-video">
              No video available for this chapter.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="rounded-t-lg bg-gray-800 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Chapter Overview</CardTitle>
              </div>
              <div className="flex space-x-3">
                {user.id === course.teacherId && (
                  // button to create an assignment
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gray-900 hover:bg-gray-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Assignment
                  </Button>
                )}
                {isModalOpen && (
                  <AssignmentModal
                    mode="create"
                    courseId={course.courseId}
                    sectionId={currentSection?.sectionId as string}
                    chapterId={currentChapter.chapterId}
                    onAssignmentChange={() => {
                      handleModalClose()
                      router.refresh()
                    }}
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                  />
                )}
                <Button
                  onClick={handleGoToPreviousChapter}
                  className="bg-gray-900 hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleGoToNextChapter}
                  className="bg-gray-900 hover:bg-gray-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 bg-gray-900">
            <ScrollArea className="h-auto max-h-48 pr-4">
              <p className="text-lg leading-relaxed text-gray-300">
                {currentChapter?.content}
              </p>
            </ScrollArea>
          </CardContent>
        </Card>

        <Tabs defaultValue="Assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 rounded-b-lg pb-10 pt-4">
            <TabsTrigger 
              value="Assignments" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="Quiz" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Quiz</span>
            </TabsTrigger>
          </TabsList>

          <div >
            <TabsContent value="Assignments">
              <Card className="border-none shadow-lg">
                  <Assignments 
                    chapterId={currentChapter.chapterId} 
                    sectionId={currentSection?.sectionId as string} 
                    courseId={course.courseId}
                    teacherId={course.teacherId}
                  />
              </Card>
            </TabsContent>

            <TabsContent value="Quiz">
              <Card className="border-none shadow-lg">
                  
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Course;