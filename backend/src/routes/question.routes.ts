import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getQuestions, generateQuestions } from '../controllers/question.controller';

const router = Router();

router.use(protect);
router.get('/', getQuestions);
router.post('/generate', generateQuestions);

export default router;
