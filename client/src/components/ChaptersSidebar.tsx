"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, CheckCircle, Trophy, Lock, AlertCircle, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SignInRequired } from "@/components/SignInRequired"
import { Spinner } from "@/components/ui/Spinner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useOrganization } from "@/context/OrganizationContext"

const ChaptersSidebar = () => {
  const router = useRouter()
  const { setOpen } = useSidebar()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const { currentOrg } = useOrganization()

  const { user, course, userProgress, chapterId, courseId, isLoading, updateChapterProgress } = useCourseProgressData()

  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div ref={sidebarRef} className="w-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold truncate">{course.title}</h2>
      </div>

      <div className="space-y-1">
        {course.sections.map((section, index) => (
          <Section
            key={section.sectionId}
            section={section}
            index={index}
            sectionProgress={userProgress.sections.find((s) => s.sectionId === section.sectionId)}
            chapterId={chapterId as string}
            courseId={courseId as string}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            handleChapterClick={handleChapterClick}
            updateChapterProgress={updateChapterProgress}
          />
        ))}
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
}: {
  section: any
  index: number
  sectionProgress: any
  chapterId: string
  courseId: string
  expandedSections: string[]
  toggleSection: (sectionTitle: string) => void
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
}) => {
  const completedChapters = sectionProgress?.chapters.filter((c: any) => c.completed).length || 0
  const totalChapters = section.chapters.length
  const isExpanded = expandedSections.includes(section.sectionTitle)

  const isReleased = section.releaseDate ? new Date(section.releaseDate) <= new Date() : true

  const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

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

      <CollapsibleContent className="px-4 pb-4 space-y-4">
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
  section: any
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
}: {
  section: any
  sectionProgress: any
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
}) => {
  if (!isReleased) {
    return null
  }

  return (
    <ul className="space-y-1">
      {section.chapters.map((chapter: any, index: number) => (
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
  handleChapterClick,
  updateChapterProgress,
  isReleased,
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const chapterProgress = sectionProgress?.chapters.find((c: any) => c.chapterId === chapter.chapterId)
  const isCompleted = chapterProgress?.completed
  const isQuizCompleted = chapterProgress?.quizCompleted || !chapter.quiz
  const isCurrentChapter = chapterId === chapter.chapterId
  const isCurrentChapterAssignmentsSubmitted =
    !chapter.assignments || chapter.assignments.every((assignment: Assignment) => assignment.submissions.length > 0)

  const handleToggleComplete = (e: React.MouseEvent) => {
    if (!isReleased) return
    e.stopPropagation()
    updateChapterProgress(sectionId, chapter.chapterId, !isCompleted)
  }

  const handleChapterSelection = () => {
    if (!isReleased) return
    handleChapterClick(sectionId, chapter.chapterId)
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const hasExpandableContent = isReleased && (!!chapter.quiz || (chapter.assignments && chapter.assignments.length > 0))

  return (
    <li>
      <Collapsible open={isExpanded && hasExpandableContent} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            "flex items-center px-2 py-2 rounded-md transition-colors",
            isCurrentChapter ? "bg-primary/10 text-primary" : "hover:bg-accent",
            !isReleased && "opacity-50 cursor-not-allowed",
          )}
          onClick={isReleased ? handleChapterSelection : undefined}
        >
          {isCompleted && isReleased ? (
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

          <span className={cn("ml-2 text-sm font-medium flex-1", isCompleted && "text-muted-foreground")}>
            {chapter.title}
          </span>

          {hasExpandableContent && (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1 hover:bg-accent rounded-full transition-colors">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
          )}

          {isReleased && (
            <div className="flex items-center ml-auto">
              {!isQuizCompleted || !isCurrentChapterAssignmentsSubmitted ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="animate-bounce">
                        <AlertCircle className="w-4 h-4 text-amber-500 cursor-help" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Complete the {isQuizCompleted ? "assignments" : "quiz"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </div>

        <CollapsibleContent className="ml-8 mt-1 space-y-1">
          {chapter.quiz && (
            <div
              className={cn(
                "flex items-center space-x-2 text-xs py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer",
                {
                  "text-green-500": isQuizCompleted,
                  "text-amber-500": !isQuizCompleted,
                },
              )}
            >
              <div className="w-4 h-4">
                {isQuizCompleted ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <span>Quiz</span>
            </div>
          )}

          {chapter.assignments?.map((assignment, i) => (
            <div
              key={assignment.assignmentId}
              className={cn(
                "flex items-center space-x-2 text-xs py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer",
                {
                  "text-green-500": assignment.submissions.length > 0,
                  "text-amber-500": assignment.submissions.length === 0,
                },
              )}
            >
              <div className="w-4 h-4">
                {assignment.submissions.length > 0 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <span>Assignment {i + 1}</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

export default ChaptersSidebar

