import { Request, Response } from "express";
import UserNotification from "../models/notificationModel";
import { getAuth } from "@clerk/express";

export const listNotifications = async (
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
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error });
  }
};
