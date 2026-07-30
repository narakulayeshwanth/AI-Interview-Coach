import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getReport } from '../controllers/report.controller';

const router = Router();

router.use(protect);
router.get('/:sessionId', getReport);

export default router;
