import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "./sendEmail";
import UserNotification from "../models/notificationModel";

export const sendNotificationAndEmail = async (
  userId: string | null,
  email: string,
  title: string,
  message: string
) => {
  try {
    await sendEmail(email, title, message);

    if (userId) {
      const notification = new UserNotification({
        notificationId: uuidv4(),
        userId,
        title,
        message,
        timestamp: new Date().toISOString(),
      });

      await notification.save();
    }
  } catch (error) {
    console.error("Error sending email/notification:", error);
  }
};
