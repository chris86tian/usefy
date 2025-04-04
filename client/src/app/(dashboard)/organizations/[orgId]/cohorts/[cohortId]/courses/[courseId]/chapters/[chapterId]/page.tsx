"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import ReactPlayer from "react-player"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import { useParams, useRouter } from "next/navigation"
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
  RefreshCw,
} from "lucide-react";
import AssignmentModal from "./assignments/_components/AssignmentModal";
import { SignInRequired } from "@/components/SignInRequired";
import { parseYouTubeTime, convertTimestampToSeconds } from "@/lib/utils";
import {
  useLikeChapterMutation,
  useDislikeChapterMutation,
  useGetChapterReactionCountQuery,
  useTrackTimeSpentMutation
} from "@/state/api"
import Quiz from "./adaptive-quiz/Quiz"
import { Spinner } from "@/components/ui/Spinner"
import { useOrganization } from "@/context/OrganizationContext"
import { AssignmentCard } from "./assignments/_components/AssignmentCard"
import { useUser } from "@clerk/nextjs"
import { useGetUserCourseSubmissionsQuery } from "@/state/api"
import FeedbackButton from "./adaptive-quiz/FeedbackButton"
import UploadedFiles from "./adaptive-quiz/UploadedFiles"
import { FileText } from "lucide-react"
import NotFound from "@/components/NotFound"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CourseComments } from "./_components/CourseComments"

const isSectionReleased = (section?: Section) => {
  if (!section) return false;
  if (!section.releaseDate) return true;
  return new Date(section.releaseDate) <= new Date();
};

const Course = () => {
  const {
    courseId,
    chapterId,
    course,
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
    quizResults,
  } = useCourseProgressData();

  const playerRef = useRef<ReactPlayer>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentOrg, isOrgLoading } = useOrganization();
  const { orgId, cohortId } = useParams();
  const { user: clerkUser } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoEndTime, setVideoEndTime] = useState<number | null>(null);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRedoingQuiz, setIsRedoingQuiz] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);

  const [likeChapter] = useLikeChapterMutation()
  const [dislikeChapter] = useDislikeChapterMutation()
  const [trackTimeSpent] = useTrackTimeSpentMutation()

  const { data: reactionCount, refetch: refetchReactionCount } = useGetChapterReactionCountQuery({ chapterId: currentChapter?.chapterId as string });

  // Get user submissions for the course
  const { data: userSubmissions = [] } = useGetUserCourseSubmissionsQuery({ 
    courseId,
    userId: clerkUser?.id as string
  }, { skip: !clerkUser?.id })

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
    ? currentOrg.admins.some((admin) => admin.userId === clerkUser?.id) ||
      currentOrg.instructors.some((instructor) => instructor.userId === clerkUser?.id)
    : false;

  useEffect(() => {
    if (currentChapter?.video) {
      const nextChapterId = findNextAvailableChapter("next");
      const nextChapter = course?.sections
        .flatMap((section) => section.chapters)
        .find((chapter) => chapter.chapterId === nextChapterId);

      if (nextChapter?.video) {
        // Check if the next chapter uses the same video URL (excluding timestamp)
        const currentVideoBase = currentChapter.video.toString().split(/[?#]/)[0];
        const nextVideoBase = nextChapter.video.toString().split(/[?#]/)[0];
        const isSameVideo = currentVideoBase === nextVideoBase;
        
        if (isSameVideo) {
          // Determine if it's a YouTube or Vimeo video
          const isYouTube = currentVideoBase.includes('youtube.com') || currentVideoBase.includes('youtu.be');
          const isVimeo = currentVideoBase.includes('vimeo.com');
          
          let nextVideoStartTime = 0;
          
          if (isYouTube) {
            // For YouTube, extract timestamp from the URL
            nextVideoStartTime = parseYouTubeTime(nextChapter.video as string);
          } else if (isVimeo && nextChapter.timestamp) {
            // For Vimeo, use the timestamp field from the chapter
            nextVideoStartTime = convertTimestampToSeconds(nextChapter.timestamp);
          }
          
          console.log("Next chapter starts at timestamp:", nextVideoStartTime);
          setVideoEndTime(nextVideoStartTime > 0 ? nextVideoStartTime : null)
        } else {
          // Different video, no auto-navigation needed within the current video
          setVideoEndTime(null);
        }
        setHasShownPrompt(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter?.video, course?.sections]);

  const sendTimeTracking = useCallback(
    async (duration: number) => {
      if (
        !clerkUser?.id ||
        !course?.courseId ||
        !currentSection?.sectionId ||
        !currentChapter?.chapterId ||
        duration < 30000 // Only track if duration is at least 1 second
      )
        return;

      try {
        const timeData = {
          userId: clerkUser.id,
          courseId: course.courseId,
          sectionId: currentSection.sectionId,
          chapterId: currentChapter.chapterId,
          durationMs: duration,
        };

        // Use the RTK Query mutation instead of direct API call
        await trackTimeSpent(timeData)
        console.log('Time tracking data sent:', timeData);
      } catch (error) {
        console.error("Error sending time tracking data:", error);
      }
    },
    [clerkUser?.id, course?.courseId, currentSection?.sectionId, currentChapter?.chapterId, trackTimeSpent],
  )

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

  const handleProgress = ({ played, playedSeconds }: { played: number; playedSeconds: number }) => {
    setProgress(played)
    
    // Chapter completion logic
    if (
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted(currentSection.sectionId, currentChapter.chapterId) &&
      isSectionReleased(currentSection)
    ) {
      // Get current chapter start timestamp
      const isYouTube = currentChapter.video?.toString().includes('youtube.com') || currentChapter.video?.toString().includes('youtu.be');
      const isVimeo = currentChapter.video?.toString().includes('vimeo.com');
      
      let currentChapterStartTime = 0;
      if (isYouTube) {
        currentChapterStartTime = parseYouTubeTime(currentChapter.video as string);
      } else if (isVimeo && currentChapter.timestamp) {
        currentChapterStartTime = convertTimestampToSeconds(currentChapter.timestamp);
      }
      
      // Determine if the user has watched the required chunk
      const hasWatchedRequiredChunk = videoEndTime 
        ? playedSeconds >= videoEndTime 
        : played >= 0.8; // Fallback to 80% if no end time
      
      // Check if the chapter has quiz and assignments
      const hasQuiz = currentChapter.quiz !== undefined;
      const hasAssignments = currentChapter.assignments && currentChapter.assignments.length > 0;
      
      // Determine if chapter should be marked as complete
      let shouldMarkComplete = false;
      
      if (hasQuiz && hasAssignments) {
        shouldMarkComplete = isQuizCompleted(currentChapter.chapterId) && isAssignmentsCompleted(currentChapter.chapterId) && hasWatchedRequiredChunk;
      } else if (hasQuiz) {
        shouldMarkComplete = isQuizCompleted(currentChapter.chapterId) && hasWatchedRequiredChunk;
      } else if (hasAssignments) {
        shouldMarkComplete = isAssignmentsCompleted(currentChapter.chapterId) && hasWatchedRequiredChunk;
      } else {
        shouldMarkComplete = hasWatchedRequiredChunk;
      }
      
      if (shouldMarkComplete) {
        setHasMarkedComplete(true)
        updateChapterProgress(currentSection.sectionId, currentChapter.chapterId, true)
      }
    }

    // Auto-navigate to next chapter when reaching the timestamp of the next video
    if (videoEndTime && Math.floor(playedSeconds) >= videoEndTime && !hasShownPrompt) {
      setHasShownPrompt(true)

      const nextChapterId = findNextAvailableChapter("next")
      const nextChapter = course?.sections
        .flatMap((section) => section.chapters)
        .find((chapter) => chapter.chapterId === nextChapterId)

      // Check if the next chapter uses the same video URL (excluding timestamp)
      const isSameVideo = nextChapter?.video && currentChapter?.video && 
        nextChapter.video.toString().split(/[?#]/)[0] === currentChapter.video.toString().split(/[?#]/)[0];

      if (isSameVideo) {
        // If it's the same video, navigate to the next chapter
        if (currentChapter?.quiz !== undefined || (currentChapter?.assignments && currentChapter.assignments.length > 0)) {
          if (!isQuizCompleted(currentChapter.chapterId)) {
            // Pause the video first
            if (playerRef.current) {
              try {
                const player = playerRef.current.getInternalPlayer()
                if (player && typeof player.pauseVideo === 'function') {
                  player.pauseVideo()
                } else if (player && typeof player.pause === 'function') {
                  player.pause()
                }
              } catch (error) {
                console.error("Error pausing video:", error)
              }
            }
            
            toast.success("Please complete the quiz before moving to the next chapter.", {
              duration: 10000,
              icon: <GraduationCap className="w-4 h-4" />,
            })

            // Scroll to quiz after a short delay to ensure toast is visible
            setTimeout(() => {
              quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 500)
            
          } else if (!isAssignmentsCompleted(currentChapter.chapterId)) {
            // Pause the video first
            if (playerRef.current) {
              try {
                const player = playerRef.current.getInternalPlayer()
                if (player && typeof player.pauseVideo === 'function') {
                  player.pauseVideo()
                } else if (player && typeof player.pause === 'function') {
                  player.pause()
                }
              } catch (error) {
                console.error("Error pausing video:", error)
              }
            }
            
            toast.success("Please complete all assignments before moving to the next chapter.", {
              duration: 10000,
              icon: <BookOpen className="w-4 h-4" />,
            })
            
            // Scroll to assignments section after a short delay
            setTimeout(() => {
              document.querySelector('.assignments-section')?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 500)
            
          } else {
            toast.success("Reached next chapter timestamp. Navigating to the next chapter.", {
              duration: 3000,
              icon: <ChevronRight className="w-6 h-6" />,
            })
            handleGoToNextChapter()
          }
        } else {
          toast.success("Reached next chapter timestamp. Navigating to the next chapter.", {
            duration: 3000,
            icon: <ChevronRight className="w-6 h-6" />,
          })
          handleGoToNextChapter()
        }
      }
    }
  };

  const handleGoToNextChapter = () => {
    if (!course) return;

    if (currentChapter?.quiz) {
      if (!isQuizCompleted(currentChapter.chapterId)) {
        toast.success("Please complete the chapter quiz before moving to the next chapter.")
        
        // Scroll to quiz after a short delay
        setTimeout(() => {
          quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 500)
        
        return
      }
    }
    
    if (currentChapter?.assignments && currentChapter.assignments.length > 0) {
      if (!isAssignmentsCompleted(currentChapter.chapterId)) {
        toast.success("Please complete all chapter assignments before moving to the next chapter.")
        
        // Scroll to assignments section after a short delay
        setTimeout(() => {
          document.querySelector('.assignments-section')?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 500)
        
        return
      }
    }
    
    const nextChapterId = findNextAvailableChapter("next")
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
  }

  const handleQuizComplete = (score: number, totalQuestions: number, passed: boolean) => {
    markQuizCompleted();
    setIsRedoingQuiz(false);
    
    if (currentChapter?.assignments && currentChapter.assignments.length > 0 && !isAssignmentsCompleted(currentChapter.chapterId)) {
      setTimeout(() => {
        document.querySelector('.assignments-section')?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }
  }

  const handleRedoQuiz = () => {
    setIsRedoingQuiz(true);
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  
  if (isOrgLoading || isLoading) return <Spinner />;
  if (!clerkUser) return <SignInRequired />;
  if (!course) return <NotFound message="Course not found" />;
  if (!currentSection || !currentChapter) return <NotFound message="Chapter not found" />;
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
          <span>{currentSection.sectionTitle}</span>
          <span>{'>'}</span>
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
                <CardTitle className="text-lg">{currentChapter.title}</CardTitle>
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
              ) : !isQuizCompleted(currentChapter.chapterId) && currentChapter.quiz ? (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Quiz Pending
                </Badge>
              ) : !isAssignmentsCompleted(currentChapter.chapterId) && currentChapter.assignments && currentChapter.assignments.length > 0 ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
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

        {/* UploadedFiles */}
        {currentSection.files && currentSection.files.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Study Materials</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <UploadedFiles files={currentSection.files} />
            </CardContent>
          </Card>
        )}

        {/* Quiz Section */}
        {currentChapter.quiz && (
          <div ref={quizRef}>
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Chapter Quiz</CardTitle>
                  </div>
                  {isQuizCompleted(currentChapter.chapterId) && !isRedoingQuiz && (
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                      <Badge variant="outline" className={quizResults?.passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        {quizResults?.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  )}
                  {isRedoingQuiz && (
                    <Badge variant="outline" className="ml-2">
                      Practice Mode
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Card className="mt-4">
                  <Quiz
                    quiz={currentChapter.quiz}
                    courseId={course.courseId}
                    chapterId={currentChapter.chapterId}
                    sectionId={currentSection.sectionId}
                    onQuizComplete={handleQuizComplete}
                  />
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assignments Section */}
        {currentChapter.assignments && currentChapter.assignments.length > 0 && (
          <Card className="border shadow-sm assignments-section">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Assignments</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-auto pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {currentChapter.assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.assignmentId}
                      isAuthorized={isAuthorized}
                      sectionId={currentSection.sectionId}
                      chapter={currentChapter}
                      course={course}
                      assignment={assignment}
                      refetch={refetch}
                    />
                  ))}
                </div>
              </ScrollArea>
              
              {/* {currentChapter.assignments.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Submissions</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllSubmissions(!showAllSubmissions)}
                    >
                      {showAllSubmissions ? "Hide All Submissions" : "View All Submissions"}
                    </Button>
                  </div>
                  
                  {showAllSubmissions && (
                    <Card className="border shadow-sm mt-4">
                      <CardContent className="pt-6">
                        <UploadedFiles 
                          files={[]}
                          submissions={userSubmissions
                            .filter((sub) => 
                              currentChapter.assignments?.some(
                                (assignment) => assignment.assignmentId === sub.assignmentId
                              ) || false
                            )
                            .map((sub) => ({
                              ...sub,
                              userName: clerkUser?.fullName || clerkUser?.username || "You"
                            }))}
                          showSubmissions={true}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )} */}
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
