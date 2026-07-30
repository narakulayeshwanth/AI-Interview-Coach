import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getCareerCoach, getReadinessReport } from '../controllers/career.controller';

const router = Router();
router.use(protect);
router.get('/coach', getCareerCoach);
router.get('/readiness', getReadinessReport);

export default router;
