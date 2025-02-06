import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Trophy,
  Lock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SignInRequired } from "@/components/SignInRequired";

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
  if (!user) return <SignInRequired />;
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
          <p className="flex items-center text-gray-500">
            {!isReleased && (
                <Lock className="mr-1 h-4 w-4 text-muted-foreground" />
            )}
            Section 0{index + 1}
            {/* section completion percentage */}
            {isReleased && (
              <span className="ml-2 text-green-500">
                {completedChapters/totalChapters * 100 || 0}% completed
              </span>
            )}
          </p>
          
          {isExpanded ? (
            <ChevronUp className="chapters-sidebar__chevron" />
          ) : (
            <ChevronDown className="chapters-sidebar__chevron" />
          )}
        </div>
        <div className="flex items-center justify-between w-full mt-2">
          <h3 className="chapters-sidebar__section-title">
            {section.sectionTitle}
          </h3>
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
      <div className="flex items-center justify-center py-4 text-gray-500">
        <Lock className="h-5 w-5 mr-2" />
        <span>Avaliable {section.releaseDate !== undefined ? 'on ' + new Date(section.releaseDate).toLocaleDateString() : 'soon'}</span>
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
        {totalChapters === 0 
          ? 'This section is still being prepared.'
          : `${completedChapters}/${totalChapters} COMPLETED`}
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
  chapter: Chapter;
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const chapterProgress = sectionProgress?.chapters.find(
    (c: any) => c.chapterId === chapter.chapterId
  );
  const isCompleted = chapterProgress?.completed;
  const isQuizCompleted = chapterProgress?.quizCompleted || !chapter.quiz;
  const isCurrentChapter = chapterId === chapter.chapterId;
  const isCurrentChapterAssignmentsSubmitted = 
    !chapter.assignments || chapter.assignments.every(
      (assignment: Assignment) => assignment.submissions.length > 0
    );

  const handleToggleComplete = (e: React.MouseEvent) => {
    if (!isReleased) return;
    e.stopPropagation();
    updateChapterProgress(sectionId, chapter.chapterId, !isCompleted);
  };

  const handleChapterSelection = () => {
    if (!isReleased) return;
    handleChapterClick(sectionId, chapter.chapterId);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <li className="flex flex-col">
      <div
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

        {isReleased && (chapter.quiz || chapter.assignments) && (
          <button 
            onClick={toggleExpand}
            className="ml-2 p-1 hover:bg-zinc-700 rounded-full transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {isReleased && (
          <div className="flex items-center space-x-2 ml-auto">
            {!isQuizCompleted || !isCurrentChapterAssignmentsSubmitted ? (
              <div className="animate-bounce">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="w-5 h-5 text-yellow-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Complete the {isQuizCompleted ? 'assignments' : 'quiz'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && isReleased && (
        <div className="ml-12 mt-2 space-y-2">
          {chapter.quiz && (
            <div 
              className={cn(
                "flex items-center space-x-2 text-sm py-1 px-2 rounded hover:bg-zinc-800 cursor-pointer",
                {
                  "text-green-500": isQuizCompleted,
                  "text-yellow-500": !isQuizCompleted
                }
              )}
            >
              <div className="w-4 h-4">
                {isQuizCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <span>Quiz</span>
            </div>
          )}
          
          {chapter.assignments?.map((assignment, i) => (
            <div 
              key={assignment.assignmentId}
              className={cn(
                "flex items-center space-x-2 text-sm py-1 px-2 rounded hover:bg-zinc-800 cursor-pointer",
                {
                  "text-green-500": assignment.submissions.length > 0,
                  "text-yellow-500": assignment.submissions.length === 0
                }
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
        </div>
      )}
    </li>
  );
};

export default ChaptersSidebar;