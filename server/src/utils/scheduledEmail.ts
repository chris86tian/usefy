import cron from "node-cron";
import Course from "../models/courseModel";
import { clerkClient } from "../index";
import { sendEmail } from "../utils/sendEmail";

const sendScheduledEmail = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const courses = await Course.scan("releaseDate").eq(today).exec();

    if (courses.length === 0) {
      return;
    }

    for (const course of courses) {
      const recipientIds = course.enrollments;
      const emailRecipients = [];
      for (const recipientId of recipientIds) {
        const user = await clerkClient.users.getUser(recipientId);
        emailRecipients.push(user.emailAddresses[0].emailAddress);
      }

      for (const recipient of emailRecipients) {
        const subject = `New Content Released: ${course.title}`;
        const body = `Hello, \n\nThe course "${course.title}" has new content available today! Check it out now.`;
        await sendEmail(recipient, subject, body);
      }
    }
  } catch (error) {
    console.error("Error sending release emails:", error);
  }
};

// Schedule the job to run daily at 8:00 AM
cron.schedule("0 8 * * *", sendScheduledEmail, {
  timezone: "America/Chicago", // Adjust timezone as needed
});

export default sendScheduledEmail;
