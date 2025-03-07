"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ChaptersSidebar from "@/components/ChaptersSidebar"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import { Spinner } from "@/components/ui/Spinner"
import { useOrganization } from "@/context/OrganizationContext"

interface ChapterLayoutProps {
  children: React.ReactNode
}

export default function ChapterLayout({ children }: ChapterLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const { currentOrg } = useOrganization()

  const {
    course,
    chapterId,
    courseId,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    updateChapterProgress,
  } = useCourseProgressData()

  // Calculate next and previous chapters
  const [nextChapter, setNextChapter] = useState<any>(null)
  const [prevChapter, setPrevChapter] = useState<any>(null)

  useEffect(() => {
    if (course && chapterId) {
      // Flatten all chapters from all sections
      const allChapters = course.sections.flatMap((section: any) =>
        section.chapters.map((chapter: any) => ({
          ...chapter,
          sectionId: section.sectionId,
        })),
      )

      const currentIndex = allChapters.findIndex((c: any) => c.chapterId === chapterId)

      if (currentIndex > 0) {
        setPrevChapter(allChapters[currentIndex - 1])
      } else {
        setPrevChapter(null)
      }

      if (currentIndex < allChapters.length - 1) {
        setNextChapter(allChapters[currentIndex + 1])
      } else {
        setNextChapter(null)
      }
    }
  }, [course, chapterId])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  // Close mobile sidebar when navigating to a new chapter
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  const handleMarkComplete = () => {
    if (currentSection && currentChapter) {
      updateChapterProgress(currentSection.sectionId, currentChapter.chapterId, true)
    }
  }

  const navigateToChapter = (chapter: any) => {
    if (chapter) {
      router.push(`/organizations/${currentOrg?.organizationId}/courses/${courseId}/chapters/${chapter.chapterId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  // Calculate current chapter number and total chapters
  const allChapters = course.sections.flatMap((section: any) => section.chapters)
  const currentChapterIndex = allChapters.findIndex((c: any) => c.chapterId === chapterId)
  const totalChapters = allChapters.length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ChaptersSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden fixed left-4 top-4 z-40">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <ChaptersSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}

        {/* Chapter Navigation */}
        <div className="sticky bottom-0 border-t border-border bg-background p-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigateToChapter(prevChapter)}
            disabled={!prevChapter}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {totalChapters > 0 && (
                <>
                  Chapter {currentChapterIndex + 1} of {totalChapters}
                </>
              )}
            </div>

            {!isChapterCompleted() && currentChapter && (
              <Button variant="outline" size="sm" onClick={handleMarkComplete} className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Mark Complete</span>
              </Button>
            )}
          </div>

          <Button
            variant="default"
            onClick={() => navigateToChapter(nextChapter)}
            disabled={!nextChapter}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}

