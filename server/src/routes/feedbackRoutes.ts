import express from 'express'
import { createFeedback, getFeedbacks, updateFeedbackStatus } from '../controllers/feedbackController'

const router = express.Router()

router.post('/', createFeedback)
router.get('/course/:courseId', getFeedbacks)
router.patch('/:feedbackId/status', updateFeedbackStatus);

export default router