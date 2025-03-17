import { Request, Response } from "express";
import UserNotification from "../models/notificationModel";
import { getAuth } from "@clerk/express";

export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const auth = getAuth(req);
  try {
    const notifications = await UserNotification.scan("userId")
      .eq(auth.userId)
      .exec();
    res.json({
      message: "Notifications retrieved successfully",
      data: notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error });
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const auth = getAuth(req);
  
  if (!auth?.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const notificationId = req.params.notificationId;
  if (!notificationId) {
    res.status(400).json({ message: "Notification ID is required" });
    return;
  }

  try {
    const notification = await UserNotification.get({
      userId: auth.userId,
      notificationId: notificationId,
    });

    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    if (notification.isRead) {
      res.json({ message: "Notification already marked as read" });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read", data: { notificationId } });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read", error: error });
  }
};
