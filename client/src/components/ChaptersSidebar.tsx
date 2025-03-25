"use client"

import type React from "react"

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react"
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Trophy,
  Lock,
  ChevronRight,
  ChevronLeft,
  FileText,
  PenTool,
  File,
  ExternalLink,
  X,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SignInRequired } from "@/components/SignInRequired"
import { Spinner } from "@/components/ui/Spinner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useOrganization } from "@/context/OrganizationContext"
import PDFViewerModal from "@/components/PDFViewerModal"
import { Document, Page } from "react-pdf"

interface Section {
  sectionId: string
  sectionTitle: string
  chapters: Chapter[]
  files?: FileResource[]
  releaseDate?: string
  progress?: SectionProgress
}

interface Chapter {
  chapterId: string
  title: string
  quiz?: any
  assignments?: any[]
}

interface FileResource {
  fileId: string
  title: string
  description: string
  fileUrl: string
}

interface SectionProgress {
  chapters: { chapterId: string; completed: boolean }[]
  completedChapters?: number
  totalChapters?: number
}

interface ChaptersSidebarContextType {
  setPreviewFile: (url: string | null) => void
}

const ChaptersSidebarContext = createContext<ChaptersSidebarContextType | null>(
  null
)

const ChaptersSidebar = () => {
  const router = useRouter()
  const params = useParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const { orgId, cohortId } = useParams()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

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
    isAssignmentsCompleted,
  } = useCourseProgressData()

  useEffect(() => {
    if (course && chapterId) {
      const currentSection = course.sections.find((section) =>
        section.chapters.some((chapter) => chapter.chapterId === chapterId)
      )

      if (currentSection && !expandedSections.includes(currentSection.sectionTitle)) {
        setExpandedSections((prev: string[]) => [...prev, currentSection.sectionTitle])
      }
    }
  }, [course, chapterId, expandedSections])

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
    setExpandedSections((prevSections: string[]) =>
      prevSections.includes(sectionTitle)
        ? prevSections.filter((title: string) => title !== sectionTitle)
        : [...prevSections, sectionTitle]
    )
  }

  const handleChapterClick = (sectionId: string, chapterId: string) => {
    router.push(
      `/organizations/${orgId}/cohorts/${cohortId}/courses/${courseId}/chapters/${chapterId}`,
      {
        scroll: false,
      }
    )
  }

  const handleBackToCourses = () => {
    router.push(`/organizations/${orgId}/cohorts/${cohortId}`)
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <ChaptersSidebarContext.Provider value={{ setPreviewFile }}>
      <div className="w-full max-w-[250px] overflow-y-auto flex flex-col h-full relative border-r border-border">
        <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed ? (
            <>
              <h2 className="text-lg font-semibold truncate">{course.title}</h2>
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
            className="mt-2 text-muted-foreground hover:text-foreground mx-4 flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to courses</span>
          </Button>
        )}

        <div className="space-y-1 flex-1 overflow-auto">
          {course.sections.map((section, index: number) => {
            const sectionProgress = userProgress.sections.find(
              (s) => s.sectionId === section.sectionId
            )

            return (
              <Section
                key={section.sectionId}
                section={section}
                index={index}
                chapterId={chapterId}
                courseId={courseId}
                handleChapterClick={handleChapterClick}
                updateChapterProgress={updateChapterProgress}
                isChapterCompleted={isChapterCompleted}
                isQuizCompleted={isQuizCompleted}
                isAssignmentsCompleted={isAssignmentsCompleted}
                toggleSection={toggleSection}
                isExpanded={expandedSections.includes(section.sectionTitle)}
                collapsed={sidebarCollapsed}
              />
            )
          })}
        </div>

        {previewFile && (
          <PDFViewerModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
          >
            <div className="bg-background p-4 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">File Preview</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewFile(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col items-center">
                <Document
                  file={previewFile}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<Spinner />}
                  error={
                    <div className="text-red-500">
                      Failed to load PDF document. Please try again.
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    width={Math.min(window.innerWidth * 0.8, 800)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {numPages > 1 && (
                  <div className="flex items-center justify-center mt-4 space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>

                    <div className="text-sm">
                      Page {pageNumber} of {numPages}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                      disabled={pageNumber >= numPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.open(previewFile, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                </Button>
              </div>
            </div>
          </PDFViewerModal>
        )}
      </div>
    </ChaptersSidebarContext.Provider>
  )
}

const Section = ({
  section,
  index,
  chapterId,
  courseId,
  handleChapterClick,
  updateChapterProgress,
  isChapterCompleted,
  isQuizCompleted,
  isAssignmentsCompleted,
  toggleSection,
  isExpanded,
  collapsed,
}: {
  section: Section
  index: number
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  isAssignmentsCompleted: (chapterId: string) => boolean
  toggleSection: (sectionTitle: string) => void
  isExpanded: boolean
  collapsed?: boolean
}) => {
  const totalChapters = section.chapters.length
  const completedChapters = section.chapters.filter((chapter) =>
    isChapterCompleted(section.sectionId, chapter.chapterId)
  ).length

  const sectionProgress = section.progress || { chapters: [] }

  const isReleased = section.releaseDate
    ? new Date(section.releaseDate) <= new Date()
    : true

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
            isAssignmentsCompleted={isAssignmentsCompleted}
            collapsed={collapsed}
            sectionIndex={index}
          />
        )}
      </div>
    )
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleSection(section.sectionTitle)}
      className="border-b border-border last:border-0"
    >
      <CollapsibleTrigger className="flex flex-col w-full px-4 py-3 hover:bg-accent/50 transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center text-muted-foreground text-sm">
            {!isReleased && <Lock className="mr-1 h-4 w-4" />}
            <span>Section {String(index + 1).padStart(2, "0")}</span>
            {isReleased && completionPercentage > 0 && (
              <Badge
                variant="outline"
                className="ml-2 bg-primary/10 text-primary text-xs"
              >
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
          isAssignmentsCompleted={isAssignmentsCompleted}
          collapsed={collapsed}
          sectionIndex={index}
        />

        {section.files && section.files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Section Files
            </h4>
            <SectionFiles
              section={section}
              sectionProgress={sectionProgress}
              chapterId={chapterId}
              courseId={courseId}
              handleChapterClick={handleChapterClick}
              updateChapterProgress={updateChapterProgress}
              isReleased={isReleased}
              isChapterCompleted={isChapterCompleted}
              isQuizCompleted={isQuizCompleted}
              isAssignmentsCompleted={isAssignmentsCompleted}
              collapsed={collapsed}
              sectionIndex={index}
            />
          </div>
        )}
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
  section: Section
  sectionProgress: SectionProgress
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
          Available{" "}
          {section.releaseDate ? "on " + new Date(section.releaseDate).toLocaleDateString() : "soon"}
        </span>
      </div>
    )
  }

  if (totalChapters === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-2">
        This section is still being prepared.
      </div>
    )
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
  isAssignmentsCompleted,
  collapsed,
  sectionIndex,
}: {
  section: Section
  sectionProgress: SectionProgress
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  isAssignmentsCompleted: (chapterId: string) => boolean
  collapsed?: boolean
  sectionIndex: number
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
          isAssignmentsCompleted={isAssignmentsCompleted}
          collapsed={collapsed}
          sectionIndex={sectionIndex}
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
  isAssignmentsCompleted,
  collapsed,
  sectionIndex,
}: {
  chapter: Chapter
  index: number
  sectionId: string
  sectionProgress: SectionProgress
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  isAssignmentsCompleted: (chapterId: string) => boolean
  collapsed?: boolean
  sectionIndex: number
}) => {
  const completed = isChapterCompleted(sectionId, chapter.chapterId)
  const quizCompleted = isQuizCompleted(chapter.chapterId)
  const assignmentsCompleted = isAssignmentsCompleted(chapter.chapterId)
  const isCurrentChapter = chapterId === chapter.chapterId

  const hasQuiz = chapter.quiz
  const hasAssignments = chapter.assignments && chapter.assignments.length > 0

  const handleToggleComplete = (e: React.MouseEvent) => {
    if (!isReleased) return
    e.stopPropagation()
    updateChapterProgress(sectionId, chapter.chapterId, !completed)
  }

  const handleChapterSelection = () => {
    if (!isReleased) return
    handleChapterClick(sectionId, chapter.chapterId)
  }

  const chapterNumber = `${sectionIndex + 1}.${index + 1}`

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
                  {!isReleased ? <Lock className="h-4 w-4" /> : chapterNumber}
                </div>
              )}
            </li>
          </TooltipTrigger>
          <TooltipContent side="right" className="space-y-1.5">
            <p className="font-medium">{chapter.title}</p>
            {(hasQuiz || hasAssignments) && (
              <div className="flex flex-col gap-1 text-xs">
                {hasQuiz && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      quizCompleted ? "text-green-500" : "text-amber-500",
                    )}
                  >
                    <FileText className="h-3 w-3" />
                    <span>Quiz {quizCompleted ? "completed" : "pending"}</span>
                  </div>
                )}
                {hasAssignments && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      assignmentsCompleted ? "text-green-500" : "text-amber-500",
                    )}
                  >
                    <PenTool className="h-3 w-3" />
                    <span>Assignments {assignmentsCompleted ? "completed" : "pending"}</span>
                  </div>
                )}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <li className="relative">
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
            {!isReleased ? <Lock className="h-3 w-3" /> : chapterNumber}
          </div>
        )}

        <span
          className={cn(
            "mx-2 text-sm font-medium flex-1",
            completed && "text-muted-foreground",
          )}
        >
          {chapter.title}
        </span>

        {/* Status indicators for quiz and assignments */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {hasQuiz && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full",
                      quizCompleted ? "text-green-500" : "text-amber-500",
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs dark:text-white">
                  Quiz {quizCompleted ? "completed" : "pending"}
                </TooltipContent>
              </Tooltip>
            )}

            {hasAssignments && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full",
                      assignmentsCompleted ? "text-green-500" : "text-amber-500",
                    )}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs dark:text-white">
                  Assignments {assignmentsCompleted ? "completed" : "pending"}
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </li>
  )
}

const SectionFiles = ({
  section,
  sectionProgress,
  chapterId,
  courseId,
  handleChapterClick,
  updateChapterProgress,
  isReleased,
  isChapterCompleted,
  isQuizCompleted,
  isAssignmentsCompleted,
  collapsed,
  sectionIndex,
}: {
  section: Section
  sectionProgress: SectionProgress
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  isAssignmentsCompleted: (chapterId: string) => boolean
  collapsed?: boolean
  sectionIndex: number
}) => {
  if (!isReleased || !section.files || section.files.length === 0) {
    return null
  }

  return (
    <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
      {section.files.map((file, index: number) => (
        <FileItem
          key={file.fileId}
          file={file}
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
          isAssignmentsCompleted={isAssignmentsCompleted}
          collapsed={collapsed}
          sectionIndex={sectionIndex}
        />
      ))}
    </ul>
  )
}

const FileItem = ({
  file,
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
  isAssignmentsCompleted,
  collapsed,
  sectionIndex,
}: {
  file: FileResource
  index: number
  sectionId: string
  sectionProgress: SectionProgress
  chapterId: string
  courseId: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
  isReleased: boolean
  isChapterCompleted: (sectionId: string, chapterId: string) => boolean
  isQuizCompleted: (chapterId: string) => boolean
  isAssignmentsCompleted: (chapterId: string) => boolean
  collapsed?: boolean
  sectionIndex: number
}) => {
  const completed = isChapterCompleted(sectionId, file.fileId)
  const isCurrentFile = file.fileId === chapterId
  const sidebarContext = useContext(ChaptersSidebarContext)

  const handleFileSelection = () => {
    if (!isReleased) return

    // If the file is a PDF, open the preview
    if (file.fileUrl && file.fileUrl.toLowerCase().endsWith(".pdf")) {
      sidebarContext?.setPreviewFile(file.fileUrl)
    } else {
      // Otherwise, navigate to the file as if it were a chapter
      handleChapterClick(sectionId, file.fileId)
    }
  }

  const fileNumber = `${sectionIndex + 1}.${index + 1}`

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <li
              className={cn(
                "flex items-center justify-center p-2 rounded-md cursor-pointer transition-colors my-2",
                isCurrentFile ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground",
                !isReleased && "opacity-50 cursor-not-allowed",
              )}
              onClick={isReleased ? handleFileSelection : undefined}
            >
              {completed && isReleased ? (
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer text-primary"
                >
                  <CheckCircle className="h-5 w-5" />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                    isCurrentFile ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {!isReleased ? <Lock className="h-4 w-4" /> : <File className="h-4 w-4" />}
                </div>
              )}
            </li>
          </TooltipTrigger>
          <TooltipContent side="right" className="space-y-1.5">
            <p className="font-medium">{file.title}</p>
            <p className="text-xs text-muted-foreground">{file.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <li className="relative">
      <div
        className={cn(
          "flex items-center px-2 py-2 rounded-md transition-colors cursor-pointer",
          isCurrentFile ? "bg-primary/10 text-primary" : "hover:bg-accent",
          !isReleased && "opacity-50 cursor-not-allowed",
        )}
        onClick={isReleased ? handleFileSelection : undefined}
      >
        {completed && isReleased ? (
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full cursor-pointer text-primary"
          >
            <CheckCircle className="h-5 w-5" />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
              isCurrentFile ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {!isReleased ? <Lock className="h-3 w-3" /> : <File className="h-3 w-3" />}
          </div>
        )}

        <span
          className={cn(
            "mx-2 text-sm font-medium flex-1",
            completed && "text-muted-foreground",
          )}
        >
          {file.title}
        </span>
      </div>
    </li>
  )
}

export default ChaptersSidebar
