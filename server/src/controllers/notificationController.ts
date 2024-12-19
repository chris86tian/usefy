import { Request, Response } from "express";
import Notification from "../models/notificationModel";

export const listNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;
  try {
    const notifications = await Notification.query("userId").eq(userId).exec();
    res.json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error });
  }
};

export const createNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, title, message } = req.body;
  try {
    const notification = new Notification({ userId, title, message });
    await notification.save();
    res.json({
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating notification", error });
  }
};
