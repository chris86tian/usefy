import * as z from "zod";

export const courseSchema = z.object({
  courseTitle: z.string().min(1, "Title is required"),
  courseDescription: z.string().optional(),
  coursePrice: z.string(),
  courseStatus: z.boolean(),
  courseImage: z.string(),
});

export type CourseFormData = z.infer<typeof courseSchema>;

export const chapterSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  content: z.string().optional(),
  video: z.union([z.string(), z.instanceof(File)]).optional(),
});

export type ChapterFormData = z.infer<typeof chapterSchema>;

export const sectionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
});

export type SectionFormData = z.infer<typeof sectionSchema>;

export const notificationSettingsSchema = z.object({
  // Notification Settings
  courseNotifications: z.boolean(),
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  notificationFrequency: z.enum(["immediate", "daily", "weekly"]),
  
  // Course Notifications
  assignmentReminders: z.boolean(),
  dueDateAlerts: z.boolean(),
  gradePostedNotifications: z.boolean(),
  courseAnnouncements: z.boolean(),
  instructorMessages: z.boolean(),
  peerInteractions: z.boolean(),
  
  // Learning Preferences
  language: z.enum(["english", "spanish", "french"]),
  timeZone: z.enum(["UTC", "EST", "PST"]),
  displayMode: z.enum(["light", "dark", "system"]),
  contentDifficulty: z.enum(["beginner", "intermediate", "advanced", "adaptive"]),
  autoPlayVideos: z.boolean(),
  showCaptions: z.boolean(),
  
  // Privacy Settings
  profileVisibility: z.enum(["all", "coursemates", "private"]),
  showOnlineStatus: z.boolean(),
  shareProgress: z.boolean(),
  allowMessageFromPeers: z.boolean(),
  
  // Study Preferences
  dailyGoalHours: z.number().min(0).max(24),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening", "anytime"]),
  breakReminders: z.boolean(),
  breakInterval: z.number().min(15).max(120),
});

export type NotificationSettingsFormData = z.infer<
  typeof notificationSettingsSchema
>;