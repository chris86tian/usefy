"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = exports.createStripePaymentIntent = exports.listTransactions = void 0;
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const userCourseProgressModel_1 = __importDefault(require("../models/userCourseProgressModel"));
dotenv_1.default.config();
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY os required but was not found in env variables");
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
});
const listTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    try {
        const transactions = userId
            ? yield transactionModel_1.default.query("userId").eq(userId).exec()
            : yield transactionModel_1.default.scan().exec();
        res.json({
            message: "Transactions retrieved successfully",
            data: transactions,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving transactions", error });
    }
});
exports.listTransactions = listTransactions;
const createStripePaymentIntent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { amount } = req.body;
    if (!amount || amount <= 0) {
        amount = 50;
    }
    try {
        const paymentIntent = yield stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            },
        });
        res.json({
            message: "",
            data: {
                clientSecret: paymentIntent.client_secret,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error creating stripe payment intent", error });
    }
});
exports.createStripePaymentIntent = createStripePaymentIntent;
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, courseId, transactionId, amount, paymentProvider } = req.body;
    try {
        // 1. get course info
        const course = yield courseModel_1.default.get(courseId);
        // 2. create transaction record
        const newTransaction = new transactionModel_1.default({
            dateTime: new Date().toISOString(),
            userId,
            courseId,
            transactionId,
            amount,
            paymentProvider,
        });
        yield newTransaction.save();
        // 3. create initial course progress
        const initialProgress = new userCourseProgressModel_1.default({
            userId,
            courseId,
            enrollmentDate: new Date().toISOString(),
            overallProgress: 0,
            sections: course.sections.map((section) => ({
                sectionId: section.sectionId,
                chapters: section.chapters.map((chapter) => ({
                    chapterId: chapter.chapterId,
                    completed: false,
                })),
            })),
            lastAccessedTimestamp: new Date().toISOString(),
        });
        yield initialProgress.save();
        // 4. add enrollment to relevant course
        yield courseModel_1.default.update({ courseId }, {
            $ADD: {
                enrollments: [{ userId }],
            },
        });
        res.json({
            message: "Purchased Course successfully",
            data: {
                transaction: newTransaction,
                courseProgress: initialProgress,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error creating transaction and enrollment", error });
    }
});
exports.createTransaction = createTransaction;
