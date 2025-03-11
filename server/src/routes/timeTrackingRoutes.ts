import express from 'express';
import { 
  createTimeTracking, 
  getChapterTimeTracking,
  getUserCourseTimeTracking, 
  getChapterStats,
} from '../controllers/timeTrackingController';

const router = express.Router();

router.post('/', createTimeTracking);
router.get('/chapter/:chapterId', getChapterTimeTracking);
router.get('/user/:userId/course/:courseId', getUserCourseTimeTracking);

// Handle OPTIONS preflight
router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.status(200).end();
});

router.options('/chapter/:chapterId', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.status(200).end();
});

router.get('/stats', (req, res) => {
    console.log('Stats route hit:', req.query); // Logging
    getChapterStats(req, res);
  });

export default router;