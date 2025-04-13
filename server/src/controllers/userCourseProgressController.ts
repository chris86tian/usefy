import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import UserCourseProgress from "../models/userCourseProgressModel";
import Course from "../models/courseModel";
import { mergeSections, calculateOverallProgress } from "../utils/utils";
import Commit from "../models/commitModel";
import { v4 as uuidv4 } from "uuid";

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    const enrolledCourses = await UserCourseProgress.query("userId")
      .eq(userId)
      .exec();

    const courseIds = enrolledCourses.map((item: any) => item.courseId);

    if (courseIds.length === 0) {
      res.json({
        message: "You are not enrolled in any courses yet",
        data: [],
      });
      return;
    }

    const courses = await Course.batchGet(courseIds);

    res.json({
      message: "Enrolled courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving enrolled courses", error });
  }
};

export const getUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;

  try {
    const progress = await UserCourseProgress.get({ userId, courseId });
    if (!progress) {
      res
        .status(404)
        .json({ message: "Course progress not found for this user" });
      return;
    }
    res.json({
      message: "Course progress retrieved successfully",
      data: progress,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user course progress", error });
  }
};

export const updateUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  const progressData = req.body;

  console.log("Progress Data:", JSON.stringify(progressData, null, 2));

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      console.log("No existing progress found, creating new progress record");
      // Initialize new progress record
      progress = new UserCourseProgress({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: [],
        lastAccessedTimestamp: new Date().toISOString(),
      });
    }

    if (!progress.sections || !Array.isArray(progress.sections)) {
      progress.sections = [];
    }

    // Log existing sections before merge
    console.log(
      "Existing sections:",
      JSON.stringify(progress.sections, null, 2)
    );

    let sectionsToMerge = [];

    if (progressData && progressData.sections) {
      sectionsToMerge = progressData.sections;
    } else if (Array.isArray(progressData)) {
      sectionsToMerge = progressData;
    }

    console.log("Sections to merge:", JSON.stringify(sectionsToMerge, null, 2));

    if (sectionsToMerge.length > 0) {
      progress.sections = mergeSections(progress.sections, sectionsToMerge);
      console.log(
        "After merge sections:",
        JSON.stringify(progress.sections, null, 2)
      );
    }

    progress.lastAccessedTimestamp = new Date().toISOString();
    progress.overallProgress = calculateOverallProgress(progress.sections);

    await progress.save();
    console.log("Final progress saved:", JSON.stringify(progress, null, 2));

    res.json({
      message: "Course progress updated successfully",
      data: progress,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      message: "Error updating user course progress",
      error,
    });
  }
};

export const updateQuizProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  const { completed, sectionId, chapterId, score, totalQuestions } = req.body;

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      // Initialize new progress record
      progress = new UserCourseProgress({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: [],
        lastAccessedTimestamp: new Date().toISOString(),
      });
    }

    // Ensure sections array exists
    if (!progress.sections || !Array.isArray(progress.sections)) {
      progress.sections = [];
    }

    const sectionIndex = progress.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      // Section not found, create a new section with the chapter
      progress.sections.push({
        sectionId,
        chapters: []
      });
    }

    // Get the newly created or existing section
    const currentSectionIndex = progress.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    // Ensure chapters array exists
    if (!progress.sections[currentSectionIndex].chapters || !Array.isArray(progress.sections[currentSectionIndex].chapters)) {
      progress.sections[currentSectionIndex].chapters = [];
    }

    const chapterIndex = progress.sections[currentSectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      // Chapter not found, create a new chapter
      progress.sections[currentSectionIndex].chapters.push({
        chapterId,
        completed: false,
        quizCompleted: false
      });
    }

    // Get the newly created or existing chapter
    const currentChapterIndex = progress.sections[currentSectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );
    
    const chapterProgress = progress.sections[currentSectionIndex].chapters[currentChapterIndex];
    const isQuizAlreadyCompleted = chapterProgress.quizCompleted;
    const passThreshold = 0.8; // 80% passing threshold
    
    // Calculate if the quiz is passed
    const isPassed = score !== undefined && totalQuestions !== undefined 
      ? (score / totalQuestions) >= passThreshold 
      : false;

    // Update quiz progress
    if (score !== undefined && totalQuestions !== undefined) {
      chapterProgress.quizScore = score;
      chapterProgress.quizTotalQuestions = totalQuestions;
      chapterProgress.quizPassed = isPassed;
    }
    
    // If this is the first time completing the quiz or we're explicitly setting completed status
    if (!isQuizAlreadyCompleted || completed !== undefined) {
      chapterProgress.quizCompleted = completed !== undefined ? completed : true;
    }
    
    progress.lastAccessedTimestamp = new Date().toISOString();
    progress.overallProgress = calculateOverallProgress(progress.sections);

    try {
      const today = new Date().toISOString().split("T")[0];

      let commit = await Commit.query("userId")
        .eq(userId)
        .where("date")
        .eq(today)
        .using("userId-date-index")
        .exec();

      if (commit.length > 0) {
        await Commit.update(
          { commitId: commit[0].commitId },
          { count: commit[0].count + 1 }
        );
      } else {
        const newCommit = new Commit({
          commitId: uuidv4(),
          userId,
          date: today,
          count: 1,
        });
        await newCommit.save();
      }
    } catch (commitError) {
      console.error("Error handling commit:", commitError);
    }

    await progress.save();
    res.json({
      message: "Quiz progress updated successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating quiz progress",
      error,
    });
  }
};
