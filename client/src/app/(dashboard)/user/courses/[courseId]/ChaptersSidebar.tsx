/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Trophy,
  Bell,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";

const ChaptersSidebar = () => {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const {
    user,
    course,
    userProgress,
    chapterId,
    courseId,
    isLoading,
    updateChapterProgress,
  } = useCourseProgressData();

  const sidebarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setOpen(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view course progress.</div>;
  if (!course || !userProgress) return <div>Error loading course content</div>;

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prevSections) =>
      prevSections.includes(sectionTitle)
        ? prevSections.filter((title) => title !== sectionTitle)
        : [...prevSections, sectionTitle]
    );
  };

  const handleChapterClick = (sectionId: string, chapterId: string) => {
    router.push(`/user/courses/${courseId}/chapters/${chapterId}`, {
      scroll: false,
    });
  };

  return (
    <div ref={sidebarRef} className="chapters-sidebar">
      <div className="chapters-sidebar__header">
        <h2 className="chapters-sidebar__title">{course.title}</h2>
        <hr className="chapters-sidebar__divider" />
      </div>
      {course.sections.map((section, index) => (
        <Section
          key={section.sectionId}
          section={section}
          index={index}
          sectionProgress={userProgress.sections.find(
            (s) => s.sectionId === section.sectionId
          )}
          chapterId={chapterId as string}
          courseId={courseId as string}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          handleChapterClick={handleChapterClick}
          updateChapterProgress={updateChapterProgress}
        />
      ))}
    </div>
  );
};

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
  section: any;
  index: number;
  sectionProgress: any;
  chapterId: string;
  courseId: string;
  expandedSections: string[];
  toggleSection: (sectionTitle: string) => void;
  handleChapterClick: (sectionId: string, chapterId: string) => void;
  updateChapterProgress: (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => void;
}) => {
  const completedChapters =
    sectionProgress?.chapters.filter((c: any) => c.completed).length || 0;
  const totalChapters = section.chapters.length;
  const isExpanded = expandedSections.includes(section.sectionTitle);

  const isReleased = section.releaseDate 
    ? new Date(section.releaseDate) <= new Date() 
    : false;

  return (
    <div className="chapters-sidebar__section">
      <div
        onClick={() => toggleSection(section.sectionTitle)}
        className="chapters-sidebar__section-header"
      >
        <div className="chapters-sidebar__section-title-wrapper">
          <p className="chapters-sidebar__section-number">
            Section 0{index + 1}
          </p>
          {isExpanded ? (
            <ChevronUp className="chapters-sidebar__chevron" />
          ) : (
            <ChevronDown className="chapters-sidebar__chevron" />
          )}
        </div>
        <div className="flex items-center justify-between w-full">
          <h3 className="chapters-sidebar__section-title">
            {section.sectionTitle}
          </h3>
          {!isReleased && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Lock className="h-4 w-4 mr-1" />
              <span>
                {section.releaseDate 
                  ? `Available ${new Date(section.releaseDate).toLocaleDateString()}`
                  : 'Locked'}
              </span>
            </div>
          )}
        </div>
      </div>
      <hr className="chapters-sidebar__divider" />

      {isExpanded && (
        <div className="chapters-sidebar__section-content">
          <ProgressVisuals
            section={section}
            sectionProgress={sectionProgress}
            completedChapters={completedChapters}
            totalChapters={totalChapters}
            isReleased={isReleased}
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
        </div>
      )}
      <hr className="chapters-sidebar__divider" />
    </div>
  );
};

const ProgressVisuals = ({
  section,
  sectionProgress,
  completedChapters,
  totalChapters,
  isReleased,
}: {
  section: any;
  sectionProgress: any;
  completedChapters: number;
  totalChapters: number;
  isReleased: boolean;
}) => {
  if (!isReleased) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Lock className="h-5 w-5 mr-2" />
        <span>Content locked</span>
      </div>
    );
  }

  return (
    <>
      <div className="chapters-sidebar__progress">
        <div className="chapters-sidebar__progress-bars">
          {section.chapters.map((chapter: any) => {
            const isCompleted = sectionProgress?.chapters.find(
              (c: any) => c.chapterId === chapter.chapterId
            )?.completed;
            return (
              <div
                key={chapter.chapterId}
                className={cn(
                  "chapters-sidebar__progress-bar",
                  isCompleted && "chapters-sidebar__progress-bar--completed"
                )}
              ></div>
            );
          })}
        </div>
        <div className="chapters-sidebar__trophy">
          <Trophy className="chapters-sidebar__trophy-icon" />
        </div>
      </div>
      <p className="chapters-sidebar__progress-text">
        {completedChapters}/{totalChapters} COMPLETED
      </p>
    </>
  );
};

const ChaptersList = ({
  section,
  sectionProgress,
  chapterId,
  courseId,
  handleChapterClick,
  updateChapterProgress,
  isReleased,
}: {
  section: any;
  sectionProgress: any;
  chapterId: string;
  courseId: string;
  handleChapterClick: (sectionId: string, chapterId: string) => void;
  updateChapterProgress: (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => void;
  isReleased: boolean;
}) => {
  if (!isReleased) {
    return null;
  }

  return (
    <ul className="chapters-sidebar__chapters">
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
  );
};

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
  chapter: any;
  index: number;
  sectionId: string;
  sectionProgress: any;
  chapterId: string;
  courseId: string;
  handleChapterClick: (sectionId: string, chapterId: string) => void;
  updateChapterProgress: (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => void;
  isReleased: boolean;
}) => {
  const chapterProgress = sectionProgress?.chapters.find(
    (c: any) => c.chapterId === chapter.chapterId
  );
  const isCompleted = chapterProgress?.completed;
  const isQuizCompleted = chapterProgress?.quizCompleted;
  const isCurrentChapter = chapterId === chapter.chapterId;

  const handleToggleComplete = (e: React.MouseEvent) => {
    if (!isReleased) return;
    e.stopPropagation();
    updateChapterProgress(sectionId, chapter.chapterId, !isCompleted);
  };

  const handleChapterSelection = () => {
    if (!isReleased) return;
    handleChapterClick(sectionId, chapter.chapterId);
  };

  return (
    <li
      className={cn("chapters-sidebar__chapter", {
        "chapters-sidebar__chapter--current": isCurrentChapter,
        "chapters-sidebar__chapter--locked": !isReleased,
        "cursor-not-allowed opacity-50": !isReleased,
      })}
      onClick={handleChapterSelection}
    >
      {isCompleted && isReleased ? (
        <div
          className="chapters-sidebar__chapter-check"
          onClick={handleToggleComplete}
          title="Toggle completion status"
        >
          <CheckCircle className="chapters-sidebar__check-icon" />
        </div>
      ) : (
        <div
          className={cn("chapters-sidebar__chapter-number", {
            "chapters-sidebar__chapter-number--current": isCurrentChapter,
          })}
        >
          {!isReleased ? <Lock className="h-4 w-4" /> : index + 1}
        </div>
      )}
      
      <span
        className={cn("chapters-sidebar__chapter-title", {
          "chapters-sidebar__chapter-title--completed": isCompleted,
          "chapters-sidebar__chapter-title--current": isCurrentChapter,
        })}
      >
        {chapter.title}
      </span>

      {isReleased && (
        <div className="flex items-center space-x-2">
          {!isQuizCompleted ? (
            <div className="animate-bounce ml-4">
              <Bell className="w-5 h-5 text-yellow-500" />
            </div>
          ) : (
            <div className="ml-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>
      )}
    </li>
  );
};


export default ChaptersSidebar;