import { ReactNode } from "react";
import { Monaco } from "@monaco-editor/react";
import { Id } from "../../convex/_generated/dataModel";
import monaco from "monaco-editor";

declare global {

  interface UserStats {
    week: string
    progress: number
  }

  interface TimeTrackingRecord {
    timeTrackingId: string;
    userId: string;
    courseId: string;
    sectionId: string;
    chapterId: string;
    durationMs: number;
    trackedAt: string;
    date: string;
  }   

  interface CourseAnalytics {
    courseId: string;
    averageChapterTimes: {
      chapterId: string;
      averageTimeMs: number;
    }[];
    totalTimeSpent: number;
  }
  
  interface Snippet {
    _id: Id<"snippets">;
    _creationTime: number;
    userId: string;
    language: string;
    code: string;
    title: string;
    userName: string;
  }
  
  interface ExecutionResult {
    code: string;
    output: string;
    error?: string | null;
    evaluation: {
      passed: boolean;
      score: number;
      explanation: string;
    };
  }
  
  interface CodeEditorState {
    language: string;
    output: string;
    isRunning: boolean;
    isSubmitting: boolean;
    error: string | null;
    theme: string;
    fontSize: number;
    editor: monaco.editor.IStandaloneCodeEditor | null;
    task: string;
    executionResult: ExecutionResult | null;
  
    setEditor: (editor: monaco.editor.IStandaloneCodeEditor) => void;
    getCode: () => string;
    setLanguage: (language: string) => void;
    setTheme: (theme: string) => void;
    setFontSize: (fontSize: number) => void;
    runCode: () => Promise<void>;
    submitCode: (task: string) => Promise<void>;
  }  
  
  interface PaymentMethod {
    methodId: string;
    type: string;
    lastFour: string;
    expiry: string;
  }

  interface UserSettings {
    // Theme & Display
    theme?: "light" | "dark" | "system";
    displayMode?: "light" | "dark" | "system";
    language?: "english" | "spanish" | "french";
    timeZone?: "UTC" | "EST" | "PST";
    
    // Notification Settings
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    courseNotifications?: boolean;
    notificationFrequency?: "immediate" | "daily" | "weekly";
    
    // Course Notifications
    assignmentReminders?: boolean;
    dueDateAlerts?: boolean;
    gradePostedNotifications?: boolean;
    courseAnnouncements?: boolean;
    instructorMessages?: boolean;
    peerInteractions?: boolean;
    
    // Learning Preferences
    contentDifficulty?: "beginner" | "intermediate" | "advanced" | "adaptive";
    autoPlayVideos?: boolean;
    showCaptions?: boolean;
    
    // Privacy Settings
    profileVisibility?: "all" | "coursemates" | "private";
    showOnlineStatus?: boolean;
    shareProgress?: boolean;
    allowMessageFromPeers?: boolean;
    
    // Study Preferences
    dailyGoalHours?: number;
    preferredStudyTime?: "morning" | "afternoon" | "evening" | "anytime";
    breakReminders?: boolean;
    breakInterval?: number;
  }

  interface Course {
    courseId: string;
    instructors?: { userId: string }[]
    title: string;
    description?: string;
    image?: string;
    price?: number;
    status: "Draft" | "Published" | "Archived";
    sections: Section[];
    enrollments?: { userId: string }[]
  }

  interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
    releaseDate?: string;
  }

  interface FileResource {
    fileId: string;
    title: string;
    description: string;
    file?: File;
    fileUrl?: string;
  }

  interface Chapter {
    chapterId: string;
    title: string;
    content?: string;
    video?: string | File;
    assignments?: Assignment[];
    comments?: ChapterComment[];
    likes?: number;
    dislikes?: number;
    quiz?: Quiz;
    timeTracking?: TimeTrackingRecord[];
    averageCompletionTime?: number;
    files?: FileResource[]
  }

  interface ChapterComment {
    id: string
    userId: string
    username: string
    content: string
    upvotes?: number
    downvotes?: number
    createdAt: string
    replies: Reply[]
  }
  
  interface Reply {
    id: string
    userId: string
    username: string
    content: string
    createdAt: string
  }

  interface Transaction {
    userId: string;
    transactionId: string;
    dateTime: string;
    courseId: string;
    paymentProvider: "stripe";
    paymentMethodId?: string;
    amount: number;
    savePaymentMethod?: boolean;
  }

  interface DateRange {
    from: string | undefined;
    to: string | undefined;
  }

  interface UserCourseProgress {
    userId: string;
    courseId: string;
    enrollmentDate: string;
    overallProgress: number;
    sections: SectionProgress[];
    lastAccessedTimestamp: string;
  }

  interface ChapterProgress {
    chapterId: string;
    completed: boolean;
    quizCompleted?: boolean;
  }

  interface SectionProgress {
    sectionId: string;
    chapters: ChapterProgress[];
  }

  type CreateUserArgs = Omit<User, "userId">;
  type CreateCourseArgs = Omit<Course, "courseId">;
  type CreateTransactionArgs = Omit<Transaction, "transactionId">;

  interface Assignment {
    assignmentId: string;
    title: string;
    description: string;
    submissions: Submission[];
    resources?: Resource[];
    fileUrl?: string;
    isCoding?: boolean;
    language?: string;
    starterCode?: string;
    hints?: string[];
  }

  interface Resource {
    id: string;
    title: string;
    type: "link" | "image" | "file";
    url: string;
    fileUrl?: string;
  }

  interface Submission {
    submissionId: string;
    userId: string;
    fileUrls?: string[];
    links?: string[];
    comment?: string;
    code?: string;
    evaluation?: {
      passed: boolean;
      score: number;
      explanation: string;
    };
  }

  interface Quiz {
    quizId: string;
    questions: Question[];
  }

  interface Question {
    questionId: string
    question: string
    difficulty?: "easy" | "medium" | "hard"
    options: string[]
    correctAnswer: number
  }

  interface Commit {
    id: string;
    userId: string;
    count: number;
    date: string;
  }

  interface CourseFormData {
    courseTitle: string;
    courseDescription: string;
    coursePrice: string;
    courseStatus: boolean;
    courseImage: string;
  }

  interface AdminCourseCardProps {
    course: Course;
    isOwner: boolean;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    onView: (course: Course) => void;
    onArchive: (course: Course) => void;
    onUnarchive: (course: Course) => void;
    onStats: (course: Course) => void;
  }

  interface AssignmentsProps {
    chapterId: string;
    sectionId: string;
    course: Course;
  }

  interface WizardStepperProps {
    currentStep: number;
  }

  interface AccordionSectionsProps {
    sections: Section[];
  }

  interface SearchCourseCardProps {
    course: Course;
    isSelected?: boolean;
    onClick?: () => void;
  }

  interface CoursePreviewProps {
    course: Course;
  }

  interface CustomFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
    rightElement?: ReactNode;
  }

  interface SelectedCourseProps {
    course: Course;
    handleEnrollNow: (courseId: string) => void;
    userId: string;
  }

  interface ChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    chapterIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    courseId: string;
  }

  interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  }

  interface DroppableComponentProps {
    sections: Section[];
    setSections: (sections: Section[]) => void;
    handleEditSection: (index: number) => void;
    handleDeleteSection: (index: number) => void;
    handleAddChapter: (sectionIndex: number) => void;
    handleEditChapter: (sectionIndex: number, chapterIndex: number) => void;
    handleDeleteChapter: (sectionIndex: number, chapterIndex: number) => void;
  }

  interface AdaptiveQuizProps {
    quiz: { questions: Question[] };
    courseId: string;
    sectionId: string;
    chapterId: string;
    onQuizComplete?: (score: number, totalQuestions: number) => void;
  }

  interface CodeProps {
    searchParams: Promise<{ 
      courseId: string;
      sectionId: string;
      chapterId: string;
      assignmentId: string;
    }>;
  }  

  interface UserListProps {
    courseId: string
    selectedUser: User | undefined
    onUserSelect: (user: User) => void
  }

  interface SubmitButtonProps {
    courseId: string;
    sectionId: string;
    chapterId: string;
    assignmentId: string;
    assignment: string;
  }

  interface Feedback {
    feedbackId: string;
    feedbackType: string;
    questionId: string;
    assignmentId: string;
    userId: string;
    username: string;
    courseId: string;
    sectionId: string;
    chapterId: string;
    feedback: string;
    createdAt: string;
    status: string;
    updatedAt: string;
  }

  interface UserNotification {
    notificationId: string
    userId: string
    title: string
    message: string
    link?: string
    isRead: boolean
    timestamp: string
  }

  interface NotificationModalProps {
    isOpen: boolean
    onClose: () => void
    notifications: UserNotification[]
  }

  type ProcessOptions = {
    generateQuizzes: boolean
    generateAssignments: boolean
    codingAssignments: boolean
    language: string
  }
  
  interface AssignmentCardProps {
    assignment: Assignment
    course: Course
    sectionId: string
    chapterId: string
  }

  interface Organization {
    organizationId: string
    name: string
    description: string
    image: string | null
    cohorts?: string[]
    admins: { userId: string }[]
    instructors: { userId: string }[]
    learners: { userId: string }[]
    courses: string[]
  }

  interface Cohort {
    cohortId: string
    name: string
    organizationId: string
    learners: { userId: string }[]
    instructors: { userId: string }[]
    courses: { courseId: string }[]
  }
}

export {};