import { Request, Response } from "express";
import TimeTracking from "../models/timeTrackingModel";
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from "@clerk/express";

interface ChapterStats {
  totalUsers: number;
  averageDuration: number;
  totalDuration: number;
  dataPoints: Array<{
    date: string;
    duration: number;
  }>;
}

interface BatchChapterStats {
  [key: string]: ChapterStats;
}

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
      message: "", 
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
      message: "",
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
      message: "",
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
    
    // Log incoming request
    console.log('getChapterStats called with:', {
      courseId,
      chapterId,
      timestamp: new Date().toISOString()
    });
    
    if (!courseId || !chapterId) {
      console.log('Missing parameters:', { courseId, chapterId });
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }

    // Log DynamoDB query
    console.log('Executing DynamoDB scan with filters:', {
      courseId,
      chapterId
    });

    const records = await TimeTracking.scan()
      .where('courseId').eq(courseId)
      .and().where('chapterId').eq(chapterId)
      .exec();

    // Log scan results
    console.log('DynamoDB scan results:', {
      recordCount: records?.length || 0,
      hasRecords: Boolean(records && records.length > 0),
      firstRecord: records?.[0] ? {
        userId: records[0].userId,
        durationMs: records[0].durationMs,
        date: records[0].date
      } : null
    });

    // If no records found, return empty stats
    if (!records || records.length === 0) {
      console.log('No records found for:', { courseId, chapterId });
      res.json({
        totalUsers: 0,
        averageDuration: 0,
        totalDuration: 0,
        dataPoints: []
      });
      return;
    }

    // Calculate unique users and their total durations
    const userDurations = records.reduce((acc: { [key: string]: number }, record) => {
      if (!acc[record.userId]) {
        acc[record.userId] = 0;
      }
      acc[record.userId] += Number(record.durationMs) || 0;
      return acc;
    }, {});

    const uniqueUsers = Object.keys(userDurations).length;
    const totalDuration = Object.values(userDurations).reduce((sum, duration) => sum + duration, 0);
    const averageDuration = uniqueUsers > 0 ? totalDuration / uniqueUsers : 0;

    // Log calculated metrics
    console.log('Calculated metrics:', {
      uniqueUsers,
      totalDuration,
      averageDuration,
      userDurations
    });

    // Group records by date for data points
    const dataPoints = records.reduce((acc: any[], record) => {
      const date = record.date;
      const existingPoint = acc.find(p => p.date === date);
      const duration = Number(record.durationMs) || 0;
      
      if (existingPoint) {
        existingPoint.duration += duration;
      } else {
        acc.push({
          date,
          duration
        });
      }
      
      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));

    // Log final response data
    console.log('Sending response:', {
      totalUsers: uniqueUsers,
      averageDuration: Math.round(averageDuration / 1000),
      totalDuration: Math.round(totalDuration / 1000),
      dataPointsCount: dataPoints.length
    });

    res.json({
      totalUsers: uniqueUsers,
      averageDuration: Math.round(averageDuration / 1000), // in seconds
      totalDuration: Math.round(totalDuration / 1000),      // in seconds
      dataPoints
    });
  } catch (error) {
    console.error("Error getting chapter stats:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        queryParams: req.query,
        timestamp: new Date().toISOString()
      });
    }
    res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getCourseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query;
    
    const records = await TimeTracking.scan()
      .where('courseId').eq(courseId)
      .exec();

    // Calculate unique users
    const uniqueUsers = new Set(records.map(record => record.userId)).size;
    
    // Calculate total duration
    const totalDuration = records.reduce((sum, record) => sum + record.durationMs, 0);
    
    // Calculate average duration per user
    const averageDurationPerUser = uniqueUsers > 0 ? totalDuration / uniqueUsers : 0;

    // Group by date for time series data
    const dailyData = records.reduce((acc: any[], record) => {
      const date = record.date;
      const existingDay = acc.find(d => d.date === date);
      
      if (existingDay) {
        existingDay.duration += record.durationMs;
        if (!existingDay.activeUsers.includes(record.userId)) {
          existingDay.activeUsers.push(record.userId);
        }
      } else {
        acc.push({
          date,
          duration: record.durationMs,
          activeUsers: [record.userId]
        });
      }
      
      return acc;
    }, []);

    // Process daily data to count unique users per day
    const processedDailyData = dailyData.map(day => ({
      date: day.date,
      duration: Math.round(day.duration / 1000), // Convert to seconds
      activeUsers: day.activeUsers.length
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      data: {
        totalUsers: uniqueUsers,
        totalDuration: Math.round(totalDuration / 1000), // Convert to seconds
        averageDurationPerUser: Math.round(averageDurationPerUser / 1000), // Convert to seconds
        dailyData: processedDailyData
      },
      message: "Course statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting course stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBatchChapterStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, chapterIds } = req.body;
    
    if (!courseId || !chapterIds || !Array.isArray(chapterIds)) {
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }

    // Process chapters in batches of 5 to avoid throughput issues
    const BATCH_SIZE = 5;
    const chapterBatches = [];
    for (let i = 0; i < chapterIds.length; i += BATCH_SIZE) {
      chapterBatches.push(chapterIds.slice(i, i + BATCH_SIZE));
    }

    const allChapterStats: BatchChapterStats = {};

    // Process each batch with a delay between batches
    for (const batch of chapterBatches) {
      // Get records for this batch of chapters
      const records = await TimeTracking.scan()
        .where('courseId').eq(courseId)
        .and().where('chapterId').in(batch)
        .exec();

      // Process records for each chapter in the batch
      batch.forEach(chapterId => {
        const chapterRecords = records.filter(record => record.chapterId === chapterId);
        
        if (!chapterRecords || chapterRecords.length === 0) {
          allChapterStats[chapterId] = {
            totalUsers: 0,
            averageDuration: 0,
            totalDuration: 0,
            dataPoints: []
          };
          return;
        }

        // Calculate unique users and their total durations
        const userDurations = chapterRecords.reduce((userAcc: { [key: string]: number }, record) => {
          if (!userAcc[record.userId]) {
            userAcc[record.userId] = 0;
          }
          userAcc[record.userId] += Number(record.durationMs) || 0;
          return userAcc;
        }, {});

        const uniqueUsers = Object.keys(userDurations).length;
        const totalDuration = Object.values(userDurations).reduce((sum, duration) => sum + duration, 0);
        const averageDuration = uniqueUsers > 0 ? totalDuration / uniqueUsers : 0;

        // Group records by date for data points
        const dataPoints = chapterRecords.reduce((dateAcc: { [key: string]: number }, record) => {
          const date = record.date.split('T')[0];
          if (!dateAcc[date]) {
            dateAcc[date] = 0;
          }
          dateAcc[date] += Number(record.durationMs) || 0;
          return dateAcc;
        }, {});

        allChapterStats[chapterId] = {
          totalUsers: uniqueUsers,
          averageDuration,
          totalDuration,
          dataPoints: Object.entries(dataPoints).map(([date, duration]) => ({
            date,
            duration
          }))
        };
      });

      // Add a small delay between batches to avoid rate limiting
      if (chapterBatches.indexOf(batch) < chapterBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    res.json(allChapterStats);
  } catch (error) {
    console.error("Error retrieving batch chapter stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};