import Stripe from "stripe";
import dotenv from "dotenv";
import { Request, Response } from "express";
import Course from "../models/courseModel";
import Transaction from "../models/transactionModel";
import UserCourseProgress from "../models/userCourseProgressModel";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY os required but was not found in env variables"
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

export const listTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  try {
    const transactions = userId
      ? await Transaction.query("userId").eq(userId).exec()
      : await Transaction.scan().exec();

    res.json({
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving transactions", error });
  }
};

export const createStripePaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  let { amount } = req.body;

  if (!amount || amount <= 0) {
    amount = 50;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    res.json({
      message: "",
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating stripe payment intent", error });
  }
};

export const createTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, transactionId, amount, paymentProvider } = req.body;

  try {
    if (amount === 0) {
      const course = await Course.get(courseId);

      const initialProgress = new UserCourseProgress({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        lastAccessedTimestamp: new Date().toISOString(),
        sections: course.sections.map((section: any) => ({
          sectionId: section.sectionId,
          chapters: section.chapters.map((chapter: any) => ({
            chapterId: chapter.chapterId,
            completed: false,
            quizCompleted: false,
          })),
        })),
      });
      await initialProgress.save();

      await Course.update(
        { courseId },
        {
          $ADD: {
            enrollments: [{ userId }],
          },
        }
      );

      res.json({ message: "Enrolled in free course successfully", data: { courseProgress: initialProgress } });
      return;
    }

    const course = await Course.get(courseId);

    const newTransaction = new Transaction({
      dateTime: new Date().toISOString(),
      userId,
      courseId,
      transactionId,
      amount,
      paymentProvider,
    });
    await newTransaction.save();

    const initialProgress = new UserCourseProgress({
      userId,
      courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      lastAccessedTimestamp: new Date().toISOString(),
      sections: course.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
          quizCompleted: false,
        })),
      })),
    });
    await initialProgress.save();

    await Course.update(
      { courseId },
      {
        $ADD: {
          enrollments: [{ userId }],
        },
      }
    );

    res.json({ message: "Purchased Course successfully", data: { transaction: newTransaction, courseProgress: initialProgress } });
  } catch (error) {
    res.status(500).json({ message: "Error creating transaction and enrollment", error });
  }
};

export const getTransactionStats = async ( req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await Transaction.scan().exec();
    const totalAmountInCents = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalAmount = totalAmountInCents / 100;
    const percentageLastMonth = transactions
      .filter(
        (transaction) =>
          new Date(transaction.dateTime) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      message: "Transaction stats retrieved successfully",
      data: {
        totalAmount,
        percentageLastMonth,
      },
    });
  } catch (error) {
    throw new Error("Error getting transaction stats");
  }
};