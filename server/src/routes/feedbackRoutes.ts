import express from 'express';
import { createFeedback, getFeedbacks } from '../controllers/feedbackController';
import { requireAuth } from "@clerk/express";

const router = express.Router();

router.post('/', requireAuth(), createFeedback);
router.get('/user/:userId', requireAuth(), getFeedbacks);

export default router;