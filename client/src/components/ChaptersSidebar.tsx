"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, CheckCircle, Trophy, Lock, AlertCircle, ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SignInRequired } from "@/components/SignInRequired"
import { Spinner } from "@/components/ui/Spinner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useOrganization } from "@/context/OrganizationContext"

const ChaptersSidebar = () => {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { currentOrg } = useOrganization()

  const {
    user,
    course,
    userProgress,
    chapterId,
    courseId,
    isLoading,
    updateChapterProgress,
    isChapterCompleted,
    isQuizCompleted,
    isCurrentChapterAssignemtsCompleted,
  } = useCourseProgressData()

  useEffect(() => {
    // If there's a current section, expand it by default
    if (course && chapterId) {
      const currentSection = course.sections.find((section) =>
        section.chapters.some((chapter) => chapter.chapterId === chapterId),
      )

      if (currentSection && !expandedSections.includes(currentSection.sectionTitle)) {
        setExpandedSections((prev) => [...prev, currentSection.sectionTitle])
      }
    }
  }, [course, chapterId, expandedSections])

  // Check if sidebar should be collapsed based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setSidebarCollapsed(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    return () => {
      window.removeEventListener("resize", checkScreenSize)
    }
  }, [])

  if (isLoading) return <Spinner />
  if (!user) return <SignInRequired />
  if (!course || !userProgress) return <div>Error loading course content</div>

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prevSections) =>
      prevSections.includes(sectionTitle)
        ? prevSections.filter((title) => title !== sectionTitle)
        : [...prevSections, sectionTitle],
    )
  }

  const handleChapterClick = (sectionId: string, chapterId: string) => {
    router.push(`/organizations/${currentOrg?.organizationId}/courses/${courseId}/chapters/${chapterId}`, {
      scroll: false,
    })
  }

  const handleBackToCourses = () => {
    router.push(`/organizations/${currentOrg?.organizationId}/courses`)
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="w-full overflow-hidden flex flex-col h-full relative">
      <div className="px-3 pb-3 border-b border-border flex items-center justify-between">
        {!sidebarCollapsed ? (
          <>
            <h2 className="text-xl font-semibold truncate">{course.title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapse}
              className="ml-2 flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className="mx-auto"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!sidebarCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToCourses}
          className="mt-2 text-muted-foreground hover:text-foreground mx-4"
        >
          Back to courses
        </Button>
      )}

      <div className="space-y-1 flex-1 overflow-auto">
        {course.sections.map((section, index: number) => {
          const sectionProgress = userProgress.sections.find((s) => s.sectionId === section.sectionId)

          return (
            <Section
              key={section.sectionId}
              section={section}
              index={index}
              sectionProgress={sectionProgress}
              chapterId={chapterId as string}
              courseId={courseId as string}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              handleChapterClick={handleChapterClick}
              updateChapterProgress={updateChapterProgress}
              isChapterCompleted={(sectionId: string, chapterId: string) => {
                if (!sectionProgress) return false
                return sectionProgress.chapters.some((c) => c.chapterId === chapterId && c.completed)
              }}
              isQuizCompleted={(chapterId: string) => {
                if (!sectionProgress) return false
                return sectionProgress.chapters.some((c) => c.chapterId === chapterId && c.quizCompleted)
              }}
              collapsed={sidebarCollapsed}
            />
          )
        })}
      </div>
    </div>
  )
}

const Section = ({
  section,
  index,
  sectionProgress,
  chapterId,
  courseId,
  expandedSections,
  toggleSection,
  handleChapterClick,
  updateChapterProgress,
  isChapterCompleted,
  isQuizCompleted,
  collapsed,
}: {
  section: Section
  index: number
  sectionProgress: any
  chapterId: string
  courseId: string
  expandedSections: string[]
  toggleSection: (sectionTitle: string) => void
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  collapsed?: boolean
}) => {
  const completedChapters = sectionProgress?.chapters.filter((c: any) => c.completed).length || 0
  const totalChapters = section.chapters.length
  const isExpanded = expandedSections.includes(section.sectionTitle)

  const isReleased = section.releaseDate ? new Date(section.releaseDate) <= new Date() : true

  const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

  if (collapsed) {
    return (
      <div className="pb-2 border-b border-border last:border-0">
        {isReleased && (
          <ChaptersList
            section={section}
            sectionProgress={sectionProgress}
            chapterId={chapterId}
            courseId={courseId}
            handleChapterClick={handleChapterClick}
            updateChapterProgress={updateChapterProgress}
            isReleased={isReleased}
            isChapterCompleted={isChapterCompleted}
            isQuizCompleted={isQuizCompleted}
            collapsed={collapsed}
          />
        )}
      </div>
    )
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleSection(section.sectionTitle)}
      className="border-b border-border"
    >
      <CollapsibleTrigger className="flex flex-col w-full px-4 py-3 hover:bg-accent/50 transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center text-muted-foreground text-sm">
            {!isReleased && <Lock className="mr-1 h-4 w-4" />}
            <span>Section {String(index + 1).padStart(2, "0")}</span>
            {isReleased && completionPercentage > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary text-xs">
                {completionPercentage}% completed
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <h3 className="font-medium text-foreground">{section.sectionTitle}</h3>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-2 pb-2 space-y-4">
        <ProgressVisuals
          section={section}
          sectionProgress={sectionProgress}
          completedChapters={completedChapters}
          totalChapters={totalChapters}
          isReleased={isReleased}
          completionPercentage={completionPercentage}
        />

        <ChaptersList
          section={section}
          sectionProgress={sectionProgress}
          chapterId={chapterId}
          courseId={courseId}
          handleChapterClick={handleChapterClick}
          updateChapterProgress={updateChapterProgress}
          isReleased={isReleased}
          isChapterCompleted={isChapterCompleted}
          isQuizCompleted={isQuizCompleted}
          collapsed={collapsed}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

const ProgressVisuals = ({
  section,
  sectionProgress,
  completedChapters,
  totalChapters,
  isReleased,
  completionPercentage,
}: {
  section: Section,
  sectionProgress: any
  completedChapters: number
  totalChapters: number
  isReleased: boolean
  completionPercentage: number
}) => {
  if (!isReleased) {
    return (
      <div className="flex items-center justify-center py-2 text-muted-foreground">
        <Lock className="h-4 w-4 mr-2" />
        <span className="text-sm">
          Available {section.releaseDate ? "on " + new Date(section.releaseDate).toLocaleDateString() : "soon"}
        </span>
      </div>
    )
  }

  if (totalChapters === 0) {
    return <div className="text-center text-sm text-muted-foreground py-2">This section is still being prepared.</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <div className="flex-1 mr-4">
          <Progress value={completionPercentage} className="h-2" />
        </div>
        <div className="bg-primary/10 p-1.5 rounded-full">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">
        {completedChapters}/{totalChapters} COMPLETED
      </p>
    </div>
  )
}

const ChaptersList = ({
  section,
  sectionProgress,
  chapterId,
  courseId,
  handleChapterClick,
  updateChapterProgress,
  isReleased,
  isChapterCompleted,
  isQuizCompleted,
  collapsed,
}: {
  section: Section,
  sectionProgress: any
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  collapsed?: boolean
}) => {
  if (!isReleased) {
    return null
  }

  return (
    <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
      {section.chapters.map((chapter, index: number) => (
        <Chapter
          key={chapter.chapterId}
          chapter={chapter}
          index={index}
          sectionId={section.sectionId}
          sectionProgress={sectionProgress}
          chapterId={chapterId}
          courseId={courseId}
          handleChapterClick={handleChapterClick}
          updateChapterProgress={updateChapterProgress}
          isReleased={isReleased}
          isChapterCompleted={isChapterCompleted}
          isQuizCompleted={isQuizCompleted}
          collapsed={collapsed}
        />
      ))}
    </ul>
  )
}

const Chapter = ({
  chapter,
  index,
  sectionId,
  sectionProgress,
  chapterId,
  courseId,
  handleChapterClick,
  updateChapterProgress,
  isReleased,
  isChapterCompleted,
  isQuizCompleted,
  collapsed,
}: {
  chapter: Chapter
  index: number
  sectionId: string
  sectionProgress: any
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  collapsed?: boolean
}) => {
  const completed = isChapterCompleted(sectionId, chapter.chapterId)
  const quizCompleted = isQuizCompleted(chapter.chapterId)
  const isCurrentChapter = chapterId === chapter.chapterId
  const isCurrentChapterAssignmentsSubmitted =
    !chapter.assignments || chapter.assignments.every((assignment: Assignment) => assignment.submissions.length > 0)

  const handleToggleComplete = (e: React.MouseEvent) => {
    if (!isReleased) return
    e.stopPropagation()
    updateChapterProgress(sectionId, chapter.chapterId, !completed)
  }

  const handleChapterSelection = () => {
    if (!isReleased) return
    handleChapterClick(sectionId, chapter.chapterId)
  }

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <li
              className={cn(
                "flex items-center justify-center p-2 rounded-md cursor-pointer transition-colors my-2",
                isCurrentChapter ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground",
                !isReleased && "opacity-50 cursor-not-allowed",
              )}
              onClick={isReleased ? handleChapterSelection : undefined}
            >
              {completed && isReleased ? (
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer text-primary"
                  onClick={handleToggleComplete}
                >
                  <CheckCircle className="h-5 w-5" />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                    isCurrentChapter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {!isReleased ? <Lock className="h-4 w-4" /> : index + 1}
                </div>
              )}
            </li>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{chapter.title}</p>
            {!quizCompleted || !isCurrentChapterAssignmentsSubmitted ? (
              <p className="text-xs text-amber-500 mt-1">Complete the {quizCompleted ? "assignments" : "quiz"}</p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <li>
      <div
        className={cn(
          "flex items-center px-2 py-2 rounded-md transition-colors",
          isCurrentChapter ? "bg-primary/10 text-primary" : "hover:bg-accent",
          !isReleased && "opacity-50 cursor-not-allowed",
        )}
        onClick={isReleased ? handleChapterSelection : undefined}
      >
        {completed && isReleased ? (
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full cursor-pointer text-primary"
            onClick={handleToggleComplete}
            title="Toggle completion status"
          >
            <CheckCircle className="h-5 w-5" />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
              isCurrentChapter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {!isReleased ? <Lock className="h-3 w-3" /> : index + 1}
          </div>
        )}

        <span className={cn("mx-2 text-sm font-medium flex-1", completed && "text-muted-foreground")}>
          {chapter.title}
        </span>

        {isReleased && (
          <div className="flex items-center ml-auto">
            {!quizCompleted || !isCurrentChapterAssignmentsSubmitted ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="animate-bounce">
                      <AlertCircle className="w-4 h-4 text-amber-500 cursor-help" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Complete the {quizCompleted ? "assignments" : "quiz"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export default ChaptersSidebar

