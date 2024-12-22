import express from "express";
import {
  createStripePaymentIntent,
  createTransaction,
  listTransactions,
  getTransactionStats,
} from "../controllers/transactionController";

const router = express.Router();

router.get("/", listTransactions);
router.post("/", createTransaction);
router.post("/stripe/payment-intent", createStripePaymentIntent);
router.get("/stats", getTransactionStats);

export default router;