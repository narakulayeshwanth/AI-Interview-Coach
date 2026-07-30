import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getLeaderboard, getDailyMissions, getBadges } from '../controllers/gamification.controller';

const router = Router();
router.use(protect);
router.get('/leaderboard', getLeaderboard);
router.get('/missions', getDailyMissions);
router.get('/badges', getBadges);

export default router;
