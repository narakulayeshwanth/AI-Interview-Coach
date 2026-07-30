import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getDashboardStats, getChartData, getStreak } from '../controllers/dashboard.controller';

const router = Router();

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/chart', getChartData);
router.get('/streak', getStreak);

export default router;
