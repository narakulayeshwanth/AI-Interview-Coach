import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Interview } from '../models/Interview';
import { AppError } from '../middleware/error.middleware';

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await Interview.findOne({
    _id: req.params.sessionId,
    userId: req.userId,
    status: 'completed',
  });
  if (!session) throw new AppError('Report not found', 404);

  // Build per-dimension averages across all answers
  const answers = session.answers as any[];
  const dims = ['grammar', 'communication', 'confidence', 'technicalAccuracy', 'starScore'];
  const breakdown = dims.map((dim) => ({
    label: dim === 'starScore' ? 'STAR Method' : dim.charAt(0).toUpperCase() + dim.slice(1),
    score: answers.length
      ? Math.round((answers.reduce((s, a) => s + (a.feedback[dim] || 0), 0) / answers.length) * 10)
      : 0,
  }));

  res.json({
    success: true,
    data: {
      session: {
        _id: session._id,
        role: session.role,
        mode: session.mode,
        company: session.company,
        companyCategory: session.companyCategory,
        difficulty: session.difficulty,
        inputMode: session.inputMode,
        overallScore: session.overallScore,
        duration: session.duration,
        xpEarned: session.xpEarned,
        weakAreas: session.weakAreas,
        improvementPlan: session.improvementPlan,
        createdAt: session.createdAt,
      },
      breakdown,
      totalAnswers: answers.length,
    },
  });
};
