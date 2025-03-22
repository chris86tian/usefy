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

  console.log("Received progress update request:");
  console.log("User ID:", userId);
  console.log("Course ID:", courseId);
  console.log("Progress Data:", JSON.stringify(progressData, null, 2));

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      console.log("No existing progress found, creating new progress record");
      progress = new UserCourseProgress({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: progressData || [],
        lastAccessedTimestamp: new Date().toISOString(),
      });
    } else {
      console.log("Found existing progress, merging with new data");
      console.log(
        "Existing sections:",
        JSON.stringify(progress.sections, null, 2)
      );
      progress.sections = mergeSections(progress.sections, progressData);
      console.log(
        "After merge sections:",
        JSON.stringify(progress.sections, null, 2)
      );
      progress.lastAccessedTimestamp = new Date().toISOString();
      progress.overallProgress = calculateOverallProgress(progress.sections);
    }

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
  const { completed, sectionId, chapterId } = req.body;

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      res.status(404).json({
        message: "Course progress not found for this user",
      });
      return;
    }

    const sectionIndex = progress.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = progress.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    progress.sections[sectionIndex].chapters[chapterIndex].quizCompleted =
      completed;
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
