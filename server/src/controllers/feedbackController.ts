import { Request, Response } from "express";
import Feedback from "../models/feedbackModel";
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from "@clerk/express";

export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, username, feedbackType, questionId, assignmentId, courseId, sectionId, chapterId, feedback, createdAt, status, updatedAt } = req.body;

    // Validate required fields
    if (!userId || !username || !feedbackType || !courseId || !sectionId || !chapterId || !feedback || !createdAt || !status || !updatedAt) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (feedbackType === 'question' && !questionId) {
      res.status(400).json({ message: "Question ID required for question feedback" });
      return;
    }
    if (feedbackType === 'assignment' && !assignmentId) {
      res.status(400).json({ message: "Assignment ID required for assignment feedback" });
      return;
    }

    const newFeedback = new Feedback({
      feedbackId: uuidv4(),
      feedbackType,
      questionId,
      assignmentId,
      userId,
      username,
      courseId,
      sectionId,
      chapterId,
      feedback,
      createdAt,
      status,
      updatedAt,
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
export const updateFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;
    const { userId } = getAuth(req);

    // if (!userId || !isInstructor(userId)) { // Instructor check
    //   res.status(403).json({ message: "Unauthorized" });
    //   return;
    // }

    const validStatuses = ['new', 'resolved', 'no_fault_found'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const updatedFeedback = await Feedback.update({
      feedbackId
    }, {
      $SET: {
        status,
        updatedAt: new Date().toISOString()
      }
    });

    res.json({ message: "Status updated", data: updatedFeedback });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    // const { userId } = getAuth(req);

    // if (!userId || !isInstructor(userId)) {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    await Feedback.delete({ feedbackId });
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};