import { Router } from 'express';
import { uploadResume } from '../middleware/upload.middleware';
import { protect } from '../middleware/auth.middleware';
import {
  uploadAndAnalyze,
  getAnalysis,
  getUserResumes,
  matchJD,
} from '../controllers/resume.controller';

const router = Router();

router.use(protect);
router.post('/upload', uploadResume, uploadAndAnalyze);
router.get('/analysis/:id', getAnalysis);
router.get('/history', getUserResumes);
router.post('/jd-match', matchJD);

export default router;
