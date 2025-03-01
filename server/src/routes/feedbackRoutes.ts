import express from 'express'
import { createFeedback, getFeedbacks, updateFeedbackStatus, deleteFeedback } from '../controllers/feedbackController'

const router = express.Router()

router.post('/', createFeedback)
router.get('/course/:courseId', getFeedbacks)
router.patch('/:feedbackId/status', updateFeedbackStatus);
router.delete('/:feedbackId', deleteFeedback);

export default router