import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { generateCoverLetter } from '../controllers/tools.controller';

const router = Router();
router.use(protect);
router.post('/cover-letter', generateCoverLetter);

export default router;
