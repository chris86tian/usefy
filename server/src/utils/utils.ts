import path from "path";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import UserNotification from "../models/notificationModel";

const resend = new Resend(process.env.RESEND_API_KEY);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestTime = 0;

export const updateCourseVideoInfo = (
  course: any,
  sectionId: string,
  chapterId: string,
  videoUrl: string
) => {
  const section = course.sections?.find((s: any) => s.sectionId === sectionId);
  if (!section) {
    throw new Error(`Section not found: ${sectionId}`);
  }

  const chapter = section.chapters?.find((c: any) => c.chapterId === chapterId);
  if (!chapter) {
    throw new Error(`Chapter not found: ${chapterId}`);
  }

  chapter.video = videoUrl;
};

export const validateUploadedFiles = (files: any) => {
  const allowedExtensions = [".mp4", ".m3u8", ".mpd", ".ts", ".m4s"];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }
};

export const getContentType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".m3u8":
      return "application/vnd.apple.mpegurl";
    case ".mpd":
      return "application/dash+xml";
    case ".ts":
      return "video/MP2T";
    case ".m4s":
      return "video/iso.segment";
    default:
      return "application/octet-stream";
  }
};

// Preserved HLS/DASH upload logic for future use
export const handleAdvancedVideoUpload = async (
  s3: any,
  files: any,
  uniqueId: string,
  bucketName: string
) => {
  const isHLSOrDASH = files.some(
    (file: any) =>
      file.originalname.endsWith(".m3u8") || file.originalname.endsWith(".mpd")
  );

  if (isHLSOrDASH) {
    // Handle HLS/MPEG-DASH Upload
    const uploadPromises = files.map((file: any) => {
      const s3Key = `videos/${uniqueId}/${file.originalname}`;
      return s3
        .upload({
          Bucket: bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: getContentType(file.originalname),
        })
        .promise();
    });
    await Promise.all(uploadPromises);

    // Determine manifest file URL
    const manifestFile = files.find(
      (file: any) =>
        file.originalname.endsWith(".m3u8") ||
        file.originalname.endsWith(".mpd")
    );
    const manifestFileName = manifestFile?.originalname || "";
    const videoType = manifestFileName.endsWith(".m3u8") ? "hls" : "dash";

    return {
      videoUrl: `${process.env.CLOUDFRONT_DOMAIN}/videos/${uniqueId}/${manifestFileName}`,
      videoType,
    };
  }

  return null; // Return null if not HLS/DASH to handle regular upload
};

export const mergeSections = (
  existingSections: any[],
  newSections: any[]
): any[] => {
  // Ensure both inputs are arrays
  if (!Array.isArray(existingSections)) {
    console.error("existingSections is not an array:", existingSections);
    existingSections = [];
  }
  
  if (!Array.isArray(newSections)) {
    console.error("newSections is not an array:", newSections);
    newSections = [];
  }
  
  console.log("mergeSections input:", { 
    existingSectionsLength: existingSections.length,
    newSectionsLength: newSections.length 
  });

  const existingSectionsMap = new Map<string, any>();

  // Build map of existing sections
  for (const existingSection of existingSections) {
    if (!existingSection || !existingSection.sectionId) {
      console.log("Skipping invalid existing section:", existingSection);
      continue;
    }
    existingSectionsMap.set(existingSection.sectionId, existingSection);
  }

  // Process new sections
  for (const newSection of newSections) {
    if (!newSection || !newSection.sectionId) {
      console.log("Skipping invalid new section:", newSection);
      continue;
    }

    const existingSection = existingSectionsMap.get(newSection.sectionId);
    
    if (existingSection) {
      existingSectionsMap.set(
        newSection.sectionId,
        {
          ...existingSection,
          ...newSection,
          // Always merge chapters to preserve completion status
          chapters: mergeChapters(
            Array.isArray(existingSection.chapters) ? existingSection.chapters : [],
            Array.isArray(newSection.chapters) ? newSection.chapters : []
          ),
        }
      );
    } else {
      // New section not in existing data
      existingSectionsMap.set(
        newSection.sectionId,
        {
          ...newSection,
          chapters: Array.isArray(newSection.chapters)
            ? newSection.chapters.map((chapter: any) => ({
                ...chapter,
                completed: chapter.completed ?? false,
                quizCompleted: chapter.quizCompleted ?? false,
              }))
            : [],
        }
      );
    }
  }

  const result = Array.from(existingSectionsMap.values());
  console.log("mergeSections result length:", result.length);
  return result;
};

export const mergeChapters = (
  existingChapters: any[],
  newChapters: any[]
): any[] => {
  // Ensure both inputs are arrays
  if (!Array.isArray(existingChapters) || !Array.isArray(newChapters)) {
    return Array.isArray(existingChapters) ? existingChapters : 
           Array.isArray(newChapters) ? newChapters.map(ch => ({
             ...ch,
             completed: ch.completed ?? false,
             quizCompleted: ch.quizCompleted ?? false
           })) : [];
  }

  const existingChaptersMap = new Map<string, any>();

  // Build map of existing chapters
  for (const existingChapter of existingChapters) {
    if (!existingChapter || !existingChapter.chapterId) continue;
    existingChaptersMap.set(existingChapter.chapterId, existingChapter);
  }

  // Process new chapters
  for (const newChapter of newChapters) {
    if (!newChapter || !newChapter.chapterId) continue;
    
    const existingChapter = existingChaptersMap.get(newChapter.chapterId);

    // Merge or add new chapter
    existingChaptersMap.set(
      newChapter.chapterId, 
      {
        ...(existingChapter || {}),
        ...newChapter,
        // Preserve completion status or use new values if provided
        completed: newChapter.completed ?? existingChapter?.completed ?? false,
        quizCompleted: newChapter.quizCompleted ?? existingChapter?.quizCompleted ?? false,
        // Preserve or merge quiz answers/results if they exist
        quizResults: newChapter.quizResults ?? existingChapter?.quizResults,
        // Always keep chapter content data from new updates
        title: newChapter.title || existingChapter?.title,
        content: newChapter.content ?? existingChapter?.content,
        video: newChapter.video ?? existingChapter?.video,
      }
    );
  }

  // Convert map back to array and ensure chapters are ordered
  return Array.from(existingChaptersMap.values())
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const calculateOverallProgress = (sections: any[]): number => {
  if (!Array.isArray(sections)) {
    console.error("Invalid sections data for progress calculation:", sections);
    return 0;
  }

  let totalChapters = 0;
  let completedChapters = 0;

  for (const section of sections) {
    if (section && Array.isArray(section.chapters)) {
      totalChapters += section.chapters.length;
      completedChapters += section.chapters.filter((chapter: any) => 
        chapter && chapter.completed === true
      ).length;
    }
  }

  return totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
};

export const sendMessage = async (
  userId: string | null,
  email: string,
  title: string,
  message: string,
  link: string | null = null,
  options: {
    sendEmail?: boolean;
    sendNotification?: boolean;
    rateLimited?: boolean;
  } = {}
) => {
  const {
    sendEmail = true,
    sendNotification = true,
    rateLimited = false,
  } = options;

  try {
    if (sendEmail) {
      if (rateLimited) {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < 500) {
          await delay(500 - timeSinceLastRequest);
        }
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: title,
        text: message,
      });
      lastRequestTime = Date.now();
    }

    if (sendNotification && userId) {
      const notification = new UserNotification({
        notificationId: uuidv4(),
        userId,
        title,
        message,
        link,
        isRead: false,
        timestamp: new Date().toISOString(),
      });

      await notification.save();
    }
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
};

export function generateTemporaryPassword(length = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
