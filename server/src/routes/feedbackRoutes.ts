import express from 'express'
import { createFeedback, getFeedbacks } from '../controllers/feedbackController'

const router = express.Router()

router.post('/', createFeedback)
router.get('/course/:courseId', getFeedbacks)

export default router