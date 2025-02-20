import { Request, Response } from "express";
import Feedback from "../models/feedbackModel";
import { v4 as uuidv4 } from 'uuid';

export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, username, questionId, courseId, sectionId, chapterId, feedback, createdAt } = req.body;

    // Validate required fields
    if (!userId || !username || !questionId || !courseId || !sectionId || !chapterId || !feedback || !createdAt) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const newFeedback = new Feedback({
      feedbackId: uuidv4(),
      userId,
      username,
      questionId,
      courseId,
      sectionId,
      chapterId,
      feedback,
      createdAt,
    });

    await newFeedback.save();
    
    res.status(201).json({ 
      message: "Feedback submitted successfully", 
      data: newFeedback 
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFeedbacks = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params
  try {
    const feedbacks = await Feedback.scan("courseId").eq(courseId).exec()
    res.json({ 
      message: "Feedbacks retrieved successfully", 
      data: feedbacks 
    })
  } catch (error) {
    res.status(500).json({ 
      message: "Error retrieving feedbacks", 
      error 
    })
  }
}