import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import UserNotification from "../models/notificationModel";

export const listNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  try {
    const notifications = await UserNotification.scan("userId")
      .eq(userId)
      .exec();
    res.json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error });
  }
};
