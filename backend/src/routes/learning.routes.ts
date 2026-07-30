import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getLearningHub } from '../controllers/learning.controller';

const router = Router();
router.use(protect);
router.post('/resources', getLearningHub);

export default router;
