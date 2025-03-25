"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import ReactPlayer from "react-player";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  BookOpen,
  GraduationCap,
  Calendar,
} from "lucide-react";
import AssignmentModal from "./assignments/_components/AssignmentModal";
import { SignInRequired } from "@/components/SignInRequired";
import { parseYouTubeTime, convertTimestampToSeconds } from "@/lib/utils";
import {
  useLikeChapterMutation,
  useDislikeChapterMutation,
  useGetChapterReactionCountQuery,
} from "@/state/api";
import AdaptiveQuiz from "./adaptive-quiz/AdaptiveQuiz";
import { Spinner } from "@/components/ui/Spinner";
import { useOrganization } from "@/context/OrganizationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssignmentCard } from "./assignments/_components/AssignmentCard";
import { useCallback } from "react";
import FeedbackButton from "./adaptive-quiz/FeedbackButton";
import UploadedFiles from "./adaptive-quiz/UploadedFiles";
import { FileText } from "lucide-react";
import NotFound from "@/components/NotFound";
import { CourseComments } from "./_components/CourseComments";

const isSectionReleased = (section?: Section) => {
  if (!section) return false;
  if (!section.releaseDate) return true;
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
    isAssignmentsCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    courseId,
    setHasMarkedComplete,
    refetch,
  } = useCourseProgressData();

  const playerRef = useRef<ReactPlayer>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentOrg, isOrgLoading } = useOrganization();
  const { orgId, cohortId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoEndTime, setVideoEndTime] = useState<number | null>(null);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const [likeChapter] = useLikeChapterMutation();
  const [dislikeChapter] = useDislikeChapterMutation();

  const { data: reactionCount, refetch: refetchReactionCount } =
    useGetChapterReactionCountQuery({
      chapterId: currentChapter?.chapterId as string,
    });

  // Define findNextAvailableChapter function before it's used
  const findNextAvailableChapter = (direction: "next" | "previous") => {
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

      if (direction === "next") {
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
              return prevSection.chapters[prevSection.chapters.length - 1]
                .chapterId;
            }
          }
        }
      }
    }
    return null;
  };

  const hasPreviousChapter = !!findNextAvailableChapter("previous");
  const hasNextChapter = !!findNextAvailableChapter("next");

  const isCurrentSectionReleased = currentSection
    ? isSectionReleased(currentSection)
    : false;

  // Only define isAuthorized if currentOrg exists
  const isAuthorized = currentOrg
    ? currentOrg.admins.some((admin) => admin.userId === user?.id) ||
      currentOrg.instructors.some(
        (instructor) => instructor.userId === user?.id
      )
    : false;

  useEffect(() => {
    if (currentChapter?.video) {
      const nextChapterId = findNextAvailableChapter("next");
      const nextChapter = course?.sections
        .flatMap((section: Section) => section.chapters)
        .find((chapter) => chapter.chapterId === nextChapterId);

      if (nextChapter?.video) {
        const nextVideoStartTime = parseYouTubeTime(
          nextChapter.video as string
        );
        console.log(nextVideoStartTime);
        setVideoEndTime(nextVideoStartTime > 0 ? nextVideoStartTime : null);
        setHasShownPrompt(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter?.video, course?.sections]);

  const sendTimeTracking = useCallback(
    async (duration: number) => {
      if (
        !user?.id ||
        !course?.courseId ||
        !currentSection?.sectionId ||
        !currentChapter?.chapterId
      )
        return;

      try {
        const timeData = {
          userId: user.id,
          courseId: course.courseId,
          sectionId: currentSection.sectionId,
          chapterId: currentChapter.chapterId,
          durationMs: duration,
        };

        // Use the production API URL
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://khbciw4vke.execute-api.us-east-1.amazonaws.com/prod";

        // Update to use full URL
        const blob = new Blob([JSON.stringify(timeData)], {
          type: "application/json",
        });
        navigator.sendBeacon(`${apiUrl}/time-tracking`, blob);

        if (!navigator.sendBeacon) {
          await fetch(`${apiUrl}/time-tracking`, {
            method: "POST",
            body: JSON.stringify(timeData),
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          });
        }
      } catch (error) {
        console.error("Error sending time tracking data:", error);
      }
    },
    [
      user?.id,
      course?.courseId,
      currentSection?.sectionId,
      currentChapter?.chapterId,
    ]
  );

  useEffect(() => {
    const startTime = Date.now();

    const handleBeforeUnload = () => {
      const duration = Date.now() - startTime;
      sendTimeTracking(duration);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      const duration = Date.now() - startTime;
      sendTimeTracking(duration);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sendTimeTracking]);

  const handleProgress = ({
    played,
    playedSeconds,
  }: {
    played: number;
    playedSeconds: number;
  }) => {
    setProgress(played);
    if (
      played >= 0.8 &&
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted(currentSection.sectionId, currentChapter.chapterId) &&
      isSectionReleased(currentSection)
    ) {
      setHasMarkedComplete(true);
      updateChapterProgress(
        currentSection.sectionId,
        currentChapter.chapterId,
        true
      );
    }

    console.log(videoEndTime);
    if (
      videoEndTime &&
      Math.floor(playedSeconds) === videoEndTime &&
      !hasShownPrompt
    ) {
      setHasShownPrompt(true);

      if (
        currentChapter?.quiz !== undefined ||
        (currentChapter?.assignments && currentChapter.assignments.length > 0)
      ) {
        if (!isQuizCompleted()) {
          toast.error(
            "Please complete the quiz before moving to the next chapter.",
            {
              duration: 10000,
              icon: <GraduationCap className="w-6 h-6 mr-2" />,
            }
          );

          quizRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          if (playerRef.current) {
            const player = playerRef.current.getInternalPlayer();
            if (player) {
              player.pauseVideo();
              player.seekTo(videoEndTime - 1);
            }
          }
        } else if (!isAssignmentsCompleted()) {
          toast.error(
            "Please complete all assignments before moving to the next chapter.",
            {
              duration: 10000,
              icon: <BookOpen className="w-6 h-6 mr-2" />,
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

    if (currentChapter?.quiz) {
      if (!isQuizCompleted()) {
        toast.error(
          "Please complete the chapter quiz before moving to the next chapter.",
          {
            duration: 5000,
            icon: <GraduationCap className="w-6 h-6 mx-1 text-green-500" />,
          }
        );
        return;
      }

      if (!isAssignmentsCompleted()) {
        toast.error(
          "Please complete all chapter assignments before moving to the next chapter.",
          {
            duration: 5000,
            icon: <BookOpen className="w-6 h-6 mx-1 text-green-500" />,
          }
        );
        return;
      }
    }

    const nextChapterId = findNextAvailableChapter("next");
    if (nextChapterId) {
      setHasShownPrompt(false);
      router.push(
        `/organizations/${currentOrg?.organizationId}/cohorts/${cohortId}/courses/${course.courseId}/chapters/${nextChapterId}`
      );
    }
  };

  const handleGoToPreviousChapter = () => {
    if (!course) return;
    const previousChapterId = findNextAvailableChapter("previous");
    if (previousChapterId) {
      router.push(
        `/organizations/${currentOrg?.organizationId}/cohorts/${cohortId}/courses/${course.courseId}/chapters/${previousChapterId}`
      );
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleLike = async () => {
    if (!currentChapter) return;
    try {
      await likeChapter({ chapterId: currentChapter.chapterId }).unwrap();
      refetchReactionCount();
    } catch (error) {
      console.error("Failed to like chapter:", error);
      toast.error("Failed to like the chapter. Please try again.");
    }
  };

  const handleDislike = async () => {
    if (!currentChapter) return;
    try {
      await dislikeChapter({ chapterId: currentChapter.chapterId }).unwrap();
      refetchReactionCount();
    } catch (error) {
      console.error("Failed to dislike chapter:", error);
      toast.error("Failed to dislike the chapter. Please try again.");
    }
  };

  // Handle video ready event
  const handleReady = () => {
    setIsReady(true);

    // If we have a timestamp, seek to that position
    if (currentChapter && currentChapter.timestamp) {
      const seconds = convertTimestampToSeconds(currentChapter.timestamp);
      if (playerRef.current) {
        playerRef.current.seekTo(seconds);
      }
    }
  };

  if (isOrgLoading || isLoading) return <Spinner />;
  if (!user) return <SignInRequired />;
  if (!course) return <NotFound message="Course not found" />;
  if (!currentSection || !currentChapter)
    return <NotFound message="Chapter not found" />;
  if (!currentOrg) return <NotFound message="Organization not found" />;

  if (!isCurrentSectionReleased && currentSection) {
    return (
      <div className="container flex flex-col items-center justify-center space-y-6 py-12">
        <div className="p-8 rounded-full bg-muted">
          <Lock className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Content Locked</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <p>
            Available{" "}
            {currentSection.releaseDate
              ? new Date(currentSection.releaseDate).toLocaleDateString()
              : "soon"}
          </p>
        </div>
        {hasPreviousChapter && (
          <Button
            onClick={handleGoToPreviousChapter}
            variant="outline"
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
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{course.title}</span>
          <span>/</span>
          <span>{currentSection.sectionTitle}</span>
          <span>/</span>
          <span className="font-medium text-foreground">
            {currentChapter.title}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{currentChapter.title}</h1>
      </div>

      <Card className="max-w-5xl mx-auto overflow-hidden border shadow-sm">
        <CardContent className="p-0" style={{ aspectRatio: "16/9" }}>
          {currentChapter.video ? (
            <ReactPlayer
              ref={playerRef}
              url={currentChapter.video as string}
              controls
              width="100%"
              height="100%"
              onProgress={handleProgress}
              onReady={handleReady}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                  },
                },
                vimeo: {
                  playerOptions: {
                    responsive: true,
                    autopause: false,
                    dnt: true,
                    playsinline: true,
                    byline: false,
                    portrait: false,
                    title: false,
                    autoplay: true,
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-muted-foreground">
                No video available for this chapter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Chapter Overview</CardTitle>
              </div>

              <div className="flex items-center gap-3">
                <FeedbackButton
                  feedbackType="question"
                  itemId={currentChapter.chapterId}
                  courseId={course.courseId}
                  sectionId={currentSection.sectionId}
                  chapterId={currentChapter.chapterId}
                ></FeedbackButton>
                {isAuthorized && (
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGoToPreviousChapter}
                    disabled={!hasPreviousChapter}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleGoToNextChapter}
                    disabled={!hasNextChapter}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <ScrollArea className="h-auto max-h-48 pr-4">
              <p className="text-base leading-relaxed">
                {currentChapter.content}
              </p>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t bg-muted/30 py-3 flex justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleLike}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">{reactionCount?.likes}</span>
                </Button>
                <Button
                  onClick={handleDislike}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span className="text-sm">{reactionCount?.dislikes}</span>
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {isChapterCompleted(
                currentSection.sectionId,
                currentChapter.chapterId
              ) ? (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Completed
                </Badge>
              ) : !isQuizCompleted() && currentChapter.quiz ? (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  Quiz Pending
                </Badge>
              ) : !isAssignmentsCompleted() &&
                currentChapter.assignments &&
                currentChapter.assignments.length > 0 ? (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  Assignments Pending
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted">
                  In Progress
                </Badge>
              )}
            </div>
          </CardFooter>
        </Card>

        {isModalOpen && (
          <AssignmentModal
            mode="create"
            courseId={course.courseId}
            sectionId={currentSection.sectionId}
            chapter={currentChapter}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onAssignmentChange={() => {
              handleModalClose();
              refetch();
            }}
            refetch={refetch}
          />
        )}

        {currentChapter.quiz && !isQuizCompleted() ? (
          <div ref={quizRef}>
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Chapter Quiz</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AdaptiveQuiz
                  quiz={currentChapter.quiz}
                  courseId={course.courseId}
                  chapterId={currentChapter.chapterId}
                  sectionId={currentSection.sectionId}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Assignments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-auto pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {currentChapter.assignments &&
                  currentChapter.assignments.length > 0 ? (
                    currentChapter.assignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.assignmentId}
                        isAuthorized={isAuthorized}
                        sectionId={currentSection.sectionId}
                        chapter={currentChapter}
                        course={course}
                        assignment={assignment}
                        refetch={refetch}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-muted-foreground">
                      No assignments available for this chapter
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* UploadedFiles */}
        {currentSection?.files && currentSection.files.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Section Materials</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <UploadedFiles files={currentSection.files} />
            </CardContent>
          </Card>
        )}

        <CourseComments
          orgId={currentOrg.organizationId}
          courseId={course.courseId}
          sectionId={currentSection.sectionId}
          chapterId={currentChapter.chapterId}
        />
      </div>
    </div>
  );
};

export default Course;
