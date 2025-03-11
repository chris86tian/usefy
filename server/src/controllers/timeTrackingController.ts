import { Request, Response } from "express";
import TimeTracking from "../models/timeTrackingModel";
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from "@clerk/express";

export const createTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, courseId, sectionId, chapterId, durationMs } = req.body;
    const trackedAt = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Validation
    if (!userId || !courseId || !sectionId || !chapterId || !durationMs) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (typeof durationMs !== 'number' || durationMs <= 0) {
      res.status(400).json({ message: "Invalid duration value" });
      return;
    }

    const newTimeTracking = new TimeTracking({
      timeTrackingId: uuidv4(),
      userId,
      courseId,
      sectionId,
      chapterId,
      durationMs,
      trackedAt,
      date
    });

    await newTimeTracking.save();
    
    res.status(201).json({ 
      message: "Time tracking recorded successfully", 
      data: newTimeTracking 
    });
  } catch (error) {
    console.error("Error creating time tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChapterTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chapterId } = req.params;
    const timeRecords = await TimeTracking.scan("chapterId").eq(chapterId).exec();
    
    res.json({
      message: "Time tracking records retrieved successfully",
      data: timeRecords
    });
  } catch (error) {
    console.error("Error retrieving time tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserCourseTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, courseId } = req.params;
    const timeRecords = await TimeTracking.scan()
      .where("userId").eq(userId)
      .and()
      .where("courseId").eq(courseId)
      .exec();
    
    res.json({
      message: "Course time tracking retrieved successfully",
      data: timeRecords
    });
  } catch (error) {
    console.error("Error retrieving course time tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChapterStats = async (req: Request, res: Response): Promise<void> => {
    
    try {
      const { courseId, chapterId } = req.query;
      
      const records = await TimeTracking.scan()
        .where('courseId').eq(courseId)
        .and().where('chapterId').eq(chapterId)
        .exec();
  
      const totalDuration = records.reduce((sum, record) => sum + record.durationMs, 0);
      const averageDuration = records.length > 0 ? totalDuration / records.length : 0;
  
      res.json({
        data: {
            totalUsers: records.length,
            averageDuration: Math.round(averageDuration / 1000), // in seconds
            totalDuration: Math.round(totalDuration / 1000),      // in seconds
            dataPoints: records.map(r => ({
              userId: r.userId,
              duration: Math.round(r.durationMs / 1000),
              date: r.trackedAt}))
        },
        message: "Statistics retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting chapter stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };