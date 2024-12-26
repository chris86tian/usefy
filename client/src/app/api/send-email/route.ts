import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { email, name, courseName, transactionId } = await req.json();

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Course Enrollment Confirmation",
      text: `Hi ${name},\n\nThank you for enrolling in the "${courseName}" course. Your transaction ID is ${transactionId || "Free Course"}. Enjoy learning!\n\nBest regards,\nGrowthHungry Team`,
      html: `<p>Hi ${name},</p>
             <p>Thank you for enrolling in the <strong>${courseName}</strong> course. Your transaction ID is <strong>${transactionId || "Free Course"}</strong>. Enjoy learning!</p>
             <p>Best regards,<br>GrowthHungry Team</p>`,
    });

    return NextResponse.json({ message: "Email sent successfully", info });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
