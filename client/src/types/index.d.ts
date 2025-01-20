declare global {
  
  interface PaymentMethod {
    methodId: string;
    type: string;
    lastFour: string;
    expiry: string;
  }

  interface UserSettings {
    theme?: "light" | "dark";
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    courseNotifications?: boolean;
    notificationFrequency?: "immediate" | "daily" | "weekly";
  }

  interface User {
    userId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email: string;
    publicMetadata: {
      userType: "teacher" | "user";
    };
    privateMetadata: {
      settings?: UserSettings;
      paymentMethods?: Array<PaymentMethod>;
      defaultPaymentMethodId?: string;
      stripeCustomerId?: string;
    };
    unsafeMetadata: {
      bio?: string;
      urls?: string[];
    };
  }

  interface Course {
    courseId: string;
    teacherId: string;
    teacherName: string;
    title: string;
    description?: string;
    category: string;
    image?: string;
    price?: number;
    level: "Beginner" | "Intermediate" | "Advanced";
    status: "Draft" | "Published" | "Archived";
    sections: Section[];
    enrollments?: Array<{
      userId: string;
    }>;
  }

  interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
    releaseDate?: string;
  }

  interface Chapter {
    chapterId: string;
    type: "Text" | "Quiz" | "Video";
    title: string;
    content: string;
    video?: string | File;
    assignments?: Assignment[];
    comments?: Comment[];
    likes?: number;
    dislikes?: number;
    quiz?: {
      questions: Question[];
    };
  }

  interface ChapterComment {
    id: string
    userId: string
    username: string
    content: string
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

  interface TeacherCourseCardProps {
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
    chapterId: string
    sectionId: string
    courseId: string
    teacherId: string
  }

  interface Assignment {
    assignmentId: string;
    title: string;
    description: string;
    submissions: Submission[];
    resources?: Resource[];
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
    code: string;
    evaluation?: {
      passed: boolean;
      score: number;
      explanation: string;
    };
  }

  interface Quiz {
    questions: Question[];
  }

  interface Question {
    question: string
    options: string[]
    correctAnswer: number
  }

  interface Commit {
    id: string;
    userId: string;
    count: number;
    date: string;
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

  interface SharedNotificationSettingsProps {
    title?: string;
    subtitle?: string;
  }

  interface SelectedCourseProps {
    course: Course;
    handleEnrollNow: (courseId: string) => void;
    userId: string;
  }

  interface ToolbarProps {
    onSearch: (search: string) => void;
    onCategoryChange: (category: string) => void;
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

  interface CourseFormData {
    courseTitle: string;
    courseDescription: string;
    courseCategory: string;
    coursePrice: string;
    courseStatus: boolean;
    courseImage: string;
  }
}

export {};