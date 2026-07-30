import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  startSession,
  submitAnswer,
  evaluateAll,
  getFollowUp,
  getSession,
  getHistory,
  getReplay,
  completeSession,
} from '../controllers/interview.controller';

const router = Router();

router.use(protect);
router.post('/start',          startSession);
router.post('/answer',         submitAnswer);      // legacy – kept for compat
router.post('/evaluate-all',   evaluateAll);       // new bulk flow
router.post('/followup',       getFollowUp);
router.post('/complete/:id',   completeSession);
router.get('/session/:id',     getSession);
router.get('/history',         getHistory);
router.get('/replay/:id',      getReplay);

export default router;
