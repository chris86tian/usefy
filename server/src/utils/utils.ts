import path from "path";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import UserNotification from "../models/notificationModel";

const resend = new Resend(process.env.RESEND_API_KEY);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  const existingSectionsMap = new Map<string, any>();

  // Map existing sections by sectionId
  for (const existingSection of existingSections) {
    existingSectionsMap.set(existingSection.sectionId, existingSection);
  }

  // Merge new sections into the existing map
  for (const newSection of newSections) {
    const section = existingSectionsMap.get(newSection.sectionId);
    if (!section) {
      // Add new section, ensuring chapters have a default structure
      existingSectionsMap.set(newSection.sectionId, {
        ...newSection,
        chapters: newSection.chapters.map((chapter: any) => ({
          ...chapter,
          completed: chapter.completed || false, // Ensure completed defaults to false
        })),
      });
    } else {
      // Merge chapters within the section
      section.chapters = mergeChapters(section.chapters, newSection.chapters);
      existingSectionsMap.set(newSection.sectionId, section);
    }
  }

  return Array.from(existingSectionsMap.values());
};

export const mergeChapters = (
  existingChapters: any[],
  newChapters: any[]
): any[] => {
  const existingChaptersMap = new Map<string, any>();

  // Map existing chapters by chapterId
  for (const existingChapter of existingChapters) {
    existingChaptersMap.set(existingChapter.chapterId, existingChapter);
  }

  // Merge new chapters into the existing map
  for (const newChapter of newChapters) {
    const existingChapter = existingChaptersMap.get(newChapter.chapterId);
    if (existingChapter) {
      // Merge existing chapter with new chapter data
      existingChaptersMap.set(newChapter.chapterId, {
        ...existingChapter,
        ...newChapter,
        completed: existingChapter.completed || false, // Retain or default completed to false
      });
    } else {
      // Add new chapter with default completed value
      existingChaptersMap.set(newChapter.chapterId, {
        ...newChapter,
        completed: newChapter.completed || false, // Default completed to false
      });
    }
  }

  return Array.from(existingChaptersMap.values());
};


export const calculateOverallProgress = (sections: any[]): number => {
  const totalChapters = sections.reduce(
    (acc: number, section: any) => acc + section.chapters.length,
    0
  );

  const completedChapters = sections.reduce(
    (acc: number, section: any) =>
      acc + section.chapters.filter((chapter: any) => chapter.completed).length,
    0
  );

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
  const { sendEmail = true, sendNotification = true, rateLimited = false } = options;

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
        timestamp: new Date().toISOString(),
      });

      await notification.save();
    }
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
};