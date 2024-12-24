'use client';

import React, { useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactPlayer from "react-player";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Notes from "./notes/page";
import Resources from "./resources/page";
import Quiz from "./quiz/page";

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
    }
  };

  const handleGoToNextChapter = () => {
    const nextChapterIndex = (currentSection?.chapters?.findIndex(
      (chapter) => chapter.chapterId === currentChapter?.chapterId
    ) ?? -1) + 1;
    if (currentSection?.chapters && nextChapterIndex < currentSection.chapters.length && course) {
      router.push(`/user/courses/${course.courseId}/chapters/${currentSection?.chapters[nextChapterIndex].chapterId}`);
    }
  };

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
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage alt={course.teacherName} />
              <AvatarFallback>{course.teacherName[0]}</AvatarFallback>
            </Avatar>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Chapter Overview</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToPreviousChapter}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToNextChapter}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* auto height */}
          <ScrollArea className="h-auto">
            <p className="text-sm">{currentChapter?.content}</p>
          </ScrollArea>
        </CardContent>
      </Card>

      <Tabs defaultValue="Notes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Notes">Notes</TabsTrigger>
          <TabsTrigger value="Resources">Resources</TabsTrigger>
          <TabsTrigger value="Quiz">Quiz</TabsTrigger>
          <TabsTrigger value="Code" onClick={() => router.push(`/user/courses/${course.courseId}/chapters/${currentChapter.chapterId}/code`)}>Code</TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="Notes">
          <Notes chapterId={currentChapter?.chapterId} />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="Resources">
          <Resources chapterId={currentChapter?.chapterId} />
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="Quiz">
          <Quiz chapterId={currentChapter?.chapterId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Course;
