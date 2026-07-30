import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Interview } from '../models/Interview';
import { Resume } from '../models/Resume';
import { User } from '../models/User';
import { callNvidia, parseJSON } from '../services/nvidia.service';

// ─── AI Career Coach ──────────────────────────────────────────────────────────
export const getCareerCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  const [sessions, resume, user] = await Promise.all([
    Interview.find({ userId: req.userId, status: 'completed' }).sort({ createdAt: -1 }).limit(10),
    Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 }),
    User.findById(req.userId).select('-password'),
  ]);

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, i) => s + i.overallScore, 0) / sessions.length)
    : 0;

  const allWeakAreas = sessions.flatMap(s => s.weakAreas);
  const weakCount: Record<string, number> = {};
  allWeakAreas.forEach(w => { weakCount[w] = (weakCount[w] || 0) + 1; });
  const topWeakAreas = Object.entries(weakCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  const systemPrompt = `You are an expert career coach and technical interview specialist.
Based on the candidate's profile, generate a personalized career coaching plan.
Return ONLY valid JSON with this exact structure:
{
  "careerRecommendations": [
    { "role": string, "matchPercent": number, "reason": string }
  ],
  "weakAreas": [
    { "area": string, "priority": "high"|"medium"|"low", "tip": string }
  ],
  "recommendedCourses": [
    { "title": string, "platform": string, "url": string, "duration": string, "level": string }
  ],
  "recommendedProjects": [
    { "title": string, "description": string, "skills": string[], "difficulty": string }
  ],
  "studyPlan": {
    "thirtyDay": string[],
    "sixtyDay": string[],
    "ninetyDay": string[]
  },
  "interviewReadiness": number
}`;

  const userPrompt = `Candidate Profile:
- Target Role: ${user?.targetRole || 'Software Developer'}
- Experience: ${user?.experienceLevel || 'fresher'}
- Average Interview Score: ${avgScore}/100
- Extracted Resume Skills: ${resume?.extractedSkills?.join(', ') || 'Not analyzed yet'}
- Missing Skills: ${resume?.missingSkills?.join(', ') || 'None identified'}
- Top Weak Areas: ${topWeakAreas.join(', ') || 'None yet'}
- Total Sessions Completed: ${sessions.length}`;

  const aiResponse = await callNvidia(systemPrompt, userPrompt);
  const coachData = parseJSON(aiResponse, {
    careerRecommendations: [
      { role: user?.targetRole || 'Software Developer', matchPercent: 75, reason: 'Strong skill alignment based on your resume' },
      { role: 'Full Stack Developer', matchPercent: 68, reason: 'Good mix of frontend and backend skills' },
    ],
    weakAreas: topWeakAreas.map(a => ({ area: a, priority: 'high', tip: `Practice ${a} daily with real interview questions` })),
    recommendedCourses: [
      { title: 'Data Structures & Algorithms', platform: 'Udemy', url: 'https://udemy.com', duration: '40 hours', level: 'Intermediate' },
      { title: 'System Design Fundamentals', platform: 'Coursera', url: 'https://coursera.org', duration: '20 hours', level: 'Advanced' },
      { title: 'Communication Skills for Tech', platform: 'LinkedIn Learning', url: 'https://linkedin.com/learning', duration: '8 hours', level: 'Beginner' },
    ],
    recommendedProjects: [
      { title: 'Full Stack E-Commerce App', description: 'Build a complete e-commerce platform with payment integration', skills: ['React', 'Node.js', 'MongoDB', 'Stripe'], difficulty: 'Medium' },
      { title: 'Real-time Chat Application', description: 'WebSocket-based chat with rooms and authentication', skills: ['Socket.io', 'Express', 'React'], difficulty: 'Medium' },
      { title: 'REST API with Rate Limiting', description: 'Scalable API with auth, caching, and rate limiting', skills: ['Node.js', 'Redis', 'JWT'], difficulty: 'Hard' },
    ],
    studyPlan: {
      thirtyDay: ['Complete DSA fundamentals', 'Practice 30 LeetCode Easy problems', 'Do 5 mock HR interviews'],
      sixtyDay: ['Tackle LeetCode Medium problems', 'Study System Design basics', 'Practice 5 Technical interviews'],
      ninetyDay: ['Mock full interview loops', 'Apply to target companies', 'Refine resume with new projects'],
    },
    interviewReadiness: Math.min(avgScore + 10, 100),
  });

  res.json({ success: true, data: { ...coachData, profile: { targetRole: user?.targetRole, avgScore, totalSessions: sessions.length, topWeakAreas } } });
};

// ─── Readiness Report ─────────────────────────────────────────────────────────
export const getReadinessReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const [sessions, resume] = await Promise.all([
    Interview.find({ userId: req.userId, status: 'completed' }).sort({ createdAt: -1 }).limit(20),
    Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 }),
  ]);

  const avgScore = sessions.length ? Math.round(sessions.reduce((s, i) => s + i.overallScore, 0) / sessions.length) : 0;
  const resumeScore = resume?.atsScore || 0;
  const sessionBonus = Math.min(sessions.length * 3, 20);
  const readiness = Math.min(Math.round(avgScore * 0.5 + resumeScore * 0.3 + sessionBonus), 100);

  const modeBreakdown = ['hr', 'technical', 'behavioral', 'managerial', 'system_design'].map(mode => {
    const modeSessions = sessions.filter((s: any) => s.mode === mode);
    return {
      mode, count: modeSessions.length,
      avgScore: modeSessions.length ? Math.round(modeSessions.reduce((s, i) => s + i.overallScore, 0) / modeSessions.length) : 0,
    };
  });

  res.json({ success: true, data: { readiness, avgScore, resumeScore, totalSessions: sessions.length, modeBreakdown } });
};
