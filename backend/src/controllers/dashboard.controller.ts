import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Interview } from '../models/Interview';
import { Resume } from '../models/Resume';
import { User } from '../models/User';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const [user, sessions, latestResume] = await Promise.all([
    User.findById(req.userId).select('-password'),
    Interview.find({ userId: req.userId, status: 'completed' }).sort({ createdAt: -1 }).limit(50),
    Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 }).select('atsScore overallGrade extractedSkills'),
  ]);

  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((s, i) => s + i.overallScore, 0) / totalSessions)
    : 0;

  // Aggregate weak areas
  const weakAreaCount: Record<string, number> = {};
  sessions.forEach((s) => s.weakAreas.forEach((w) => { weakAreaCount[w] = (weakAreaCount[w] || 0) + 1; }));
  const sortedWeak = Object.entries(weakAreaCount).sort((a, b) => b[1] - a[1]);
  const weakAreas = sortedWeak.slice(0, 3).map(([k]) => k);
  const strongAreas = sortedWeak.slice(-2).map(([k]) => k);

  // Radar data from last session
  const lastSession = sessions[0];
  const radarData = lastSession?.answers?.length
    ? [
        { skill: 'Grammar', score: avg(lastSession.answers.map((a: any) => a.feedback.grammar)) * 10 },
        { skill: 'Communication', score: avg(lastSession.answers.map((a: any) => a.feedback.communication)) * 10 },
        { skill: 'Confidence', score: avg(lastSession.answers.map((a: any) => a.feedback.confidence)) * 10 },
        { skill: 'Technical', score: avg(lastSession.answers.map((a: any) => a.feedback.technicalAccuracy)) * 10 },
        { skill: 'STAR', score: avg(lastSession.answers.map((a: any) => a.feedback.starScore)) * 10 },
      ]
    : defaultRadar();

  // Readiness %
  const readinessPercent = Math.round(
    (avgScore * 0.5) +
    ((latestResume?.atsScore || 0) * 0.3) +
    (Math.min(totalSessions * 2, 20))
  );

  res.json({
    success: true,
    data: {
      readinessPercent: Math.min(readinessPercent, 100),
      resumeScore: latestResume?.atsScore || 0,
      resumeGrade: latestResume?.overallGrade || 'N/A',
      totalSessions,
      avgScore,
      streak: user?.streak || 0,
      xp: user?.xp || 0,
      level: user?.level || 1,
      weakAreas,
      strongAreas,
      radarData,
    },
  });
};

export const getChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  const sessions = await Interview.find({ userId: req.userId, status: 'completed' })
    .select('overallScore createdAt mode role')
    .sort({ createdAt: 1 })
    .limit(30);

  const chartData = sessions.map((s) => ({
    date: new Date(s.createdAt as Date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: s.overallScore,
    mode: s.mode,
    role: s.role,
  }));

  res.json({ success: true, data: chartData });
};

export const getStreak = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select('streak lastActiveDate xp level');
  res.json({ success: true, data: user });
};

// Helpers
function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function defaultRadar() {
  return [
    { skill: 'Grammar', score: 0 },
    { skill: 'Communication', score: 0 },
    { skill: 'Confidence', score: 0 },
    { skill: 'Technical', score: 0 },
    { skill: 'STAR', score: 0 },
  ];
}
