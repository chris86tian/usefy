import express from 'express';
import { 
  createTimeTracking, 
  getChapterTimeTracking,
  getUserCourseTimeTracking, 
  getChapterStats,
  getCourseStats,
  getBatchChapterStats
} from '../controllers/timeTrackingController';

const router = express.Router();

router.post('/', createTimeTracking);
router.get('/chapter/:chapterId', getChapterTimeTracking);
router.get('/user-course/:userId/:courseId', getUserCourseTimeTracking);
router.get('/stats', getChapterStats);
router.get('/course-stats', getCourseStats);
router.post('/batch-stats', getBatchChapterStats);

// Handle OPTIONS preflight
router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.status(200).end();
});

router.options('/chapter/:chapterId', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.status(200).end();
});

export default router;