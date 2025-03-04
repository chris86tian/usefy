"use client"

import { useRef, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import ReactPlayer from "react-player"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import { useRouter } from "next/navigation"
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
  MessagesSquare,
} from "lucide-react"
import AssignmentModal from "./_components/AssignmentModal"
import Assignments from "./assignments/Assignments"
import { SignInRequired } from "@/components/SignInRequired"
import { parseYouTubeTime } from "@/lib/utils"
import { CourseComments } from "./_components/CourseComments"
import { useLikeChapterMutation, useDislikeChapterMutation } from "@/state/api"
import AdaptiveQuiz from "./adaptive-quiz/AdaptiveQuiz"
import { Spinner } from "@/components/ui/Spinner"
import { useOrganization } from "@/context/OrganizationContext"

const isSectionReleased = (section: Section) => {
  if (!section.releaseDate) return false
  return new Date(section.releaseDate) <= new Date()
}

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
  } = useCourseProgressData()

  const playerRef = useRef<ReactPlayer>(null)
  const quizRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { currentOrg } = useOrganization()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [videoEndTime, setVideoEndTime] = useState<number | null>(null)
  const [hasShownPrompt, setHasShownPrompt] = useState(false)
  const [likes, setLikes] = useState(currentChapter?.likes ?? 0)
  const [dislikes, setDislikes] = useState(currentChapter?.dislikes ?? 0)

  const [likeChapter] = useLikeChapterMutation()
  const [dislikeChapter] = useDislikeChapterMutation()

  useEffect(() => {
    if (currentChapter?.video) {
      const nextChapterId = findNextAvailableChapter("next")
      const nextChapter = course?.sections
        .flatMap((section) => section.chapters)
        .find((chapter) => chapter.chapterId === nextChapterId)

      if (nextChapter?.video) {
        const nextVideoStartTime = parseYouTubeTime(nextChapter.video as string)
        setVideoEndTime(nextVideoStartTime > 0 ? nextVideoStartTime : null)
        setHasShownPrompt(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter?.video, course?.sections])

  const findNextAvailableChapter = (direction: "next" | "previous") => {
    if (!course?.sections || !currentSection || !currentChapter) return null

    const currentSectionIndex = course.sections.findIndex((section) => section.sectionId === currentSection.sectionId)

    const currentChapterIndex = currentSection.chapters.findIndex(
      (chapter) => chapter.chapterId === currentChapter.chapterId,
    )

    let sectionIndex = currentSectionIndex
    let chapterIndex = currentChapterIndex

    while (sectionIndex >= 0 && sectionIndex < course.sections.length) {
      const section = course.sections[sectionIndex]

      if (direction === "next") {
        if (chapterIndex < section.chapters.length - 1) {
          if (isSectionReleased(section)) {
            return section.chapters[chapterIndex + 1].chapterId
          }
        }
        sectionIndex++
        chapterIndex = 0

        if (sectionIndex < course.sections.length) {
          const nextSection = course.sections[sectionIndex]
          if (isSectionReleased(nextSection)) {
            if (nextSection.chapters.length > 0) {
              return nextSection.chapters[0].chapterId
            }
          }
        }
      } else {
        if (chapterIndex > 0) {
          if (isSectionReleased(section)) {
            return section.chapters[chapterIndex - 1].chapterId
          }
        }
        sectionIndex--
        if (sectionIndex >= 0) {
          const prevSection = course.sections[sectionIndex]
          if (isSectionReleased(prevSection)) {
            if (prevSection.chapters.length > 0) {
              return prevSection.chapters[prevSection.chapters.length - 1].chapterId
            }
          }
        }
      }
    }

    return null
  }

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
      setHasMarkedComplete(true)
      updateChapterProgress(currentSection.sectionId, currentChapter.chapterId, true)
    }

    if (videoEndTime && Math.floor(playedSeconds) === videoEndTime && !hasShownPrompt) {
      setHasShownPrompt(true)

      if (currentChapter?.quiz && !isQuizCompleted()) {
        toast.error("Please complete the quiz before moving to the next chapter.", {
          duration: 10000,
          icon: <GraduationCap className="w-6 h-6 mr-2" />,
        })

        quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })

        if (playerRef.current) {
          const player = playerRef.current.getInternalPlayer()
          if (player) {
            player.pauseVideo()
            player.seekTo(videoEndTime - 1)
          }
        }
      } else {
        toast.error("You've reached the end of this chapter. Moving to the next one.", {
          duration: 5000,
          icon: <ChevronRight className="w-6 h-6 mx-1 text-green-500" />,
        })
        handleGoToNextChapter()
      }
    }
  }

  const handleGoToNextChapter = () => {
    if (!course) return

    if (currentChapter?.quiz && (!isQuizCompleted() || !isCurrentChapterAssignemtsCompleted())) {
      toast.error(
        `Please complete the chapter ${isQuizCompleted() ? "assignments" : "quiz"} before moving to the next chapter.`,
        {
          duration: 5000,
          icon: <GraduationCap className="w-6 h-6 mx-1 text-green-500" />,
        },
      )
      return
    }

    const nextChapterId = findNextAvailableChapter("next")
    if (nextChapterId) {
      setHasShownPrompt(false)
      router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/chapters/${nextChapterId}`)
    }
  }

  const handleGoToPreviousChapter = () => {
    if (!course) return
    const previousChapterId = findNextAvailableChapter("previous")
    if (previousChapterId) {
      router.push(`/organizations/${currentOrg?.organizationId}/courses/${course.courseId}/chapters/${previousChapterId}`)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleLike = async () => {
    if (!currentChapter) return

    setLikes((prevLikes) => prevLikes + 1)

    try {
      await likeChapter({
        courseId: course?.courseId as string,
        sectionId: currentSection?.sectionId as string,
        chapterId: currentChapter.chapterId,
      }).unwrap()
    } catch (error) {
      console.error("Failed to like chapter:", error)
      toast.error("Failed to like the chapter. Please try again.")

      setLikes((prevLikes) => prevLikes - 1)
    }
  }

  const handleDislike = async () => {
    if (!currentChapter) return

    setDislikes((prevDislikes) => prevDislikes + 1)

    try {
      await dislikeChapter({
        courseId: course?.courseId as string,
        sectionId: currentSection?.sectionId as string,
        chapterId: currentChapter.chapterId,
      }).unwrap()
    } catch (error) {
      console.error("Failed to dislike chapter:", error)
      toast.error("Failed to dislike the chapter. Please try again.")

      setDislikes((prevDislikes) => prevDislikes - 1)
    }
  }

  if (isLoading) return <Spinner />
  if (!user) return <SignInRequired />

  if (!course || !userProgress || !currentChapter || !currentSection)
    return <div className="p-4 text-center">Error loading course</div>

  const isCurrentSectionReleased = isSectionReleased(currentSection)
  const hasPreviousChapter = !!findNextAvailableChapter("previous")
  const hasNextChapter = !!findNextAvailableChapter("next")

  if (!isCurrentSectionReleased) {
    return (
      <div className="container flex flex-col items-center justify-center space-y-6 py-12">
        <div className="p-8 rounded-full bg-muted">
          <Lock className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Content Locked</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <p>
            Available on{" "}
            {currentSection.releaseDate
              ? new Date(currentSection.releaseDate).toLocaleDateString()
              : "Unknown release date"}
          </p>
        </div>
        {hasPreviousChapter && (
          <Button onClick={handleGoToPreviousChapter} variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go to Previous Chapter
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
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
            <Badge variant="outline" className="px-3 py-1">
              {/* {course.instructors[0].userId} */}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="max-w-5xl mx-auto overflow-hidden border shadow-sm">
        <CardContent className="p-0" style={{ aspectRatio: "16/9" }}>
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
        <div className="flex items-center justify-center h-full bg-muted">
          <p className="text-muted-foreground">No video available for this chapter.</p>
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
                {/* {course.instructors.some((instructor) => instructor.userId === user.id) && (
                  <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )} */}

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
                  <Button onClick={handleGoToNextChapter} disabled={!hasNextChapter} variant="outline" size="sm">
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <ScrollArea className="h-auto max-h-48 pr-4">
              <p className="text-base leading-relaxed">{currentChapter?.content}</p>
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
                  <span className="text-sm">{likes}</span>
                </Button>
                <Button
                  onClick={handleDislike}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span className="text-sm">{dislikes}</span>
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {isChapterCompleted() ? (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Completed
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
                  quiz={currentChapter.quiz as Quiz}
                  courseId={course.courseId}
                  chapterId={currentChapter.chapterId}
                  sectionId={currentSection?.sectionId}
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
              <Assignments
                chapterId={currentChapter.chapterId}
                sectionId={currentSection?.sectionId}
                course={course}
              />
            </CardContent>
          </Card>
        )}

        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center space-x-3">
              <MessagesSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Discussion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CourseComments
              courseId={course.courseId}
              sectionId={currentSection.sectionId}
              chapterId={currentChapter.chapterId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Course