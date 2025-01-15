'use client';

import React, { useRef, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import ReactPlayer from "react-player";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { BookOpen, FileText, GraduationCap } from "lucide-react";
import AssignmentModal from "./_components/AssignmentModal";
import Assignments from "./assignments/page";
import Quizzes from "./quizzes/page";
import { SignInRequired } from "@/components/SignInRequired";

const parseYouTubeTime = (url: string) => {
  const timeParam = url.split('t=')[1];
  if (!timeParam) return 0;

  let seconds = 0;
  const minutes = timeParam.match(/(\d+)m/);
  const secs = timeParam.match(/(\d+)s/);

  if (minutes) seconds += parseInt(minutes[1]) * 60;
  if (secs) seconds += parseInt(secs[1]);

  return seconds;
};


const isSectionReleased = (section: Section) => {
  if (!section.releaseDate) return false;
  return new Date(section.releaseDate) <= new Date();
};

const Course = () => {
  const {
    user,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    isQuizCompleted,
    isCurrentChapterAssignemtsCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
  } = useCourseProgressData();

  const playerRef = useRef<ReactPlayer>(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoEndTime, setVideoEndTime] = useState<number | null>(null);
  const [hasShownPrompt, setHasShownPrompt] = useState(false); 

  useEffect(() => {
    if (currentChapter?.video) {
      const nextChapterId = findNextAvailableChapter('next');
      const nextChapter = course?.sections
        .flatMap(section => section.chapters)
        .find(chapter => chapter.chapterId === nextChapterId);

      if (nextChapter?.video) {
        const nextVideoStartTime = parseYouTubeTime(nextChapter.video as string);
        setVideoEndTime(nextVideoStartTime > 0 ? nextVideoStartTime : null);
        setHasShownPrompt(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter?.video, course?.sections]);

  const findNextAvailableChapter = (
    direction: 'next' | 'previous'
  ) => {
    if (!course?.sections || !currentSection || !currentChapter) return null;
  
    const currentSectionIndex = course.sections.findIndex(
      (section) => section.sectionId === currentSection.sectionId
    );
    
    const currentChapterIndex = currentSection.chapters.findIndex(
      (chapter) => chapter.chapterId === currentChapter.chapterId
    );
  
    let sectionIndex = currentSectionIndex;
    let chapterIndex = currentChapterIndex;
  
    while (sectionIndex >= 0 && sectionIndex < course.sections.length) {
      const section = course.sections[sectionIndex];
  
      if (direction === 'next') {
        if (chapterIndex < section.chapters.length - 1) {
          if (isSectionReleased(section)) {
            return section.chapters[chapterIndex + 1].chapterId;
          }
        }
        sectionIndex++;
        chapterIndex = 0;

        if (sectionIndex < course.sections.length) {
          const nextSection = course.sections[sectionIndex];
          if (isSectionReleased(nextSection)) {
            if (nextSection.chapters.length > 0) {
              return nextSection.chapters[0].chapterId;
            }
          }
        }
      } else {
        if (chapterIndex > 0) {
          if (isSectionReleased(section)) {
            return section.chapters[chapterIndex - 1].chapterId;
          }
        }
        sectionIndex--;
        if (sectionIndex >= 0) {
          const prevSection = course.sections[sectionIndex];
          if (isSectionReleased(prevSection)) {
            if (prevSection.chapters.length > 0) {
              return prevSection.chapters[prevSection.chapters.length - 1].chapterId;
            }
          }
        }
      }
    }
  
    return null;
  };  

  const handleProgress = ({ played, playedSeconds }: { played: number; playedSeconds: number }) => {
    if (
      played >= 0.8 &&
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted() &&
      isSectionReleased(currentSection)
    ) {
      setHasMarkedComplete(true);
      updateChapterProgress(
        currentSection.sectionId,
        currentChapter.chapterId,
        true
      );
    }

    if (
      videoEndTime &&
      Math.floor(playedSeconds) === videoEndTime &&
      !hasShownPrompt
    ) {
      setHasShownPrompt(true);
  
      if (currentChapter?.quiz && !isQuizCompleted()) {
        toast.error(
          "Please complete the quiz before moving to the next chapter.",
          {
            duration: 10000,
            icon: <GraduationCap className="w-6 h-6 mr-2" />,
          }
        );
  
        if (playerRef.current) {
          const player = playerRef.current.getInternalPlayer();
          if (player) {
            player.pauseVideo();
            player.seekTo(videoEndTime - 1);
          }
        }
      } else {
        toast.error(
          "You've reached the end of this chapter. Moving to the next one.",
          {
            duration: 5000,
            icon: <ChevronRight className="w-6 h-6 mx-1 text-green-500" />,
          }
        );
        handleGoToNextChapter();
      }
    }
  };

  const handleGoToNextChapter = () => {
    if (!course) return;
    
    if (currentChapter?.quiz && (!isQuizCompleted() || !isCurrentChapterAssignemtsCompleted())) {
      toast.error(
        `Please complete the chapter ${isQuizCompleted() ? 'assignments' : 'quiz'} before moving to the next chapter.`,
        {
          duration: 5000,
          icon: <GraduationCap className="w-6 h-6 mx-1 text-green-500" />,
        }
      );
      return;
    }
    
    const nextChapterId = findNextAvailableChapter('next');
    if (nextChapterId) {
      setHasShownPrompt(false);
      router.push(`/user/courses/${course.courseId}/chapters/${nextChapterId}`);
    }
  };

  const handleGoToPreviousChapter = () => {
    if (!course) return;
    const previousChapterId = findNextAvailableChapter('previous');
    if (previousChapterId) {
      router.push(`/user/courses/${course.courseId}/chapters/${previousChapterId}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  if (isLoading) return <Loading />;
  if (!user) return <SignInRequired />;
  if (!course || !userProgress || !currentChapter || !currentSection) 
    return <div className="p-4 text-center">Error loading course</div>;

  const isCurrentSectionReleased = isSectionReleased(currentSection);
  const hasPreviousChapter = !!findNextAvailableChapter('previous');
  const hasNextChapter = !!findNextAvailableChapter('next');

  if(!currentChapter) return <div className="p-4 text-center">Error loading chapter</div>;

  if (!isCurrentSectionReleased) {
    return (
      <div className="container flex flex-col items-center justify-center space-y-6 py-6">
        <Lock className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-500">Content Locked</h2>
        <p className="text-gray-500 text-center">
          This section will be available on{' '}
          {currentSection.releaseDate ? new Date(currentSection.releaseDate).toLocaleDateString() : 'Unknown release date'}
        </p>
        {hasPreviousChapter && (
          <Button
            onClick={handleGoToPreviousChapter}
            className="mt-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go to Previous Chapter
          </Button>
        )}
      </div>
    );
  }

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
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
                {isModalOpen && (
                  <AssignmentModal
                    mode="create"
                    courseId={course.courseId}
                    sectionId={currentSection?.sectionId as string}
                    chapterId={currentChapter.chapterId}
                    chapter={currentChapter}
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onAssignmentChange={() => {
                      handleModalClose()
                      router.refresh()
                    }}
                  />
                )}
                <div className="flex items-center justify-between space-x-2">
                  <Button
                    onClick={handleGoToPreviousChapter}
                    disabled={!hasPreviousChapter}
                    className="bg-gray-900 hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleGoToNextChapter}
                    disabled={!hasNextChapter}
                    className="bg-gray-900 hover:bg-gray-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
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
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 rounded-b-lg pb-12 pt-4">
            <TabsTrigger 
              value="Assignments" 
              className="bg-gray-900 m-auto px-8 py-2 flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="Quiz" 
              className="bg-gray-900 m-auto px-8 py-2 flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
                {isQuizCompleted() ? (
                  <div className="bg-gray-900 text-green-500 p-4 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <Quizzes 
                    quiz={currentChapter.quiz as Quiz}
                    courseId={course.courseId}
                    chapterId={currentChapter.chapterId}
                    sectionId={currentSection?.sectionId as string}
                  />
                )}
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Course;