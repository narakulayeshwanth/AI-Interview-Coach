import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Interview } from '../models/Interview';

const BADGES = [
  { id: 'first_interview',   icon: '🎤', name: 'First Steps',      desc: 'Completed your first interview',          condition: (s: number) => s >= 1 },
  { id: 'five_interviews',   icon: '🔥', name: 'On Fire',          desc: 'Completed 5 interviews',                 condition: (s: number) => s >= 5 },
  { id: 'ten_interviews',    icon: '💎', name: 'Diamond Coder',    desc: 'Completed 10 interviews',                condition: (s: number) => s >= 10 },
  { id: 'perfect_score',     icon: '⭐', name: 'Perfectionist',    desc: 'Scored 90+ in an interview',             condition: (_s: number, max: number) => max >= 90 },
  { id: 'streak_7',          icon: '📅', name: 'Week Warrior',     desc: '7-day practice streak',                  condition: (_s: number, _m: number, streak: number) => streak >= 7 },
  { id: 'streak_30',         icon: '🏆', name: 'Month Master',     desc: '30-day practice streak',                 condition: (_s: number, _m: number, streak: number) => streak >= 30 },
  { id: 'all_modes',         icon: '🌟', name: 'Mode Explorer',    desc: 'Tried all interview modes',              condition: (s: number, _m: number, _st: number, modes: number) => modes >= 5 },
  { id: 'level_5',           icon: '🚀', name: 'Rising Star',      desc: 'Reached Level 5',                        condition: (_s: number, _m: number, _st: number, _mo: number, level: number) => level >= 5 },
  { id: 'level_10',          icon: '👑', name: 'Interview King',   desc: 'Reached Level 10',                       condition: (_s: number, _m: number, _st: number, _mo: number, level: number) => level >= 10 },
];

const MISSIONS = [
  { id: 'daily_interview', icon: '🎤', title: 'Daily Interview',  desc: 'Complete 1 mock interview today',     xp: 50,  type: 'interview' },
  { id: 'resume_check',    icon: '📄', title: 'Resume Review',    desc: 'Analyze your resume today',           xp: 30,  type: 'resume'    },
  { id: 'high_score',      icon: '🎯', title: 'Score Hunter',     desc: 'Get 75+ in an interview today',       xp: 75,  type: 'score'     },
  { id: 'voice_session',   icon: '🎙️', title: 'Voice Mode',       desc: 'Complete a voice interview',          xp: 60,  type: 'voice'     },
  { id: 'replay_review',   icon: '🔄', title: 'Replay & Learn',   desc: 'Review an interview replay',          xp: 25,  type: 'replay'    },
];

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find().select('name targetRole xp level streak')
    .sort({ xp: -1 }).limit(50).lean();

  const board = users.map((u, i) => ({
    rank: i + 1,
    name: u.name,
    targetRole: u.targetRole || 'Developer',
    xp: u.xp || 0,
    level: u.level || 1,
    streak: u.streak || 0,
    isCurrentUser: u._id.toString() === req.userId,
    avatar: u.name.charAt(0).toUpperCase(),
  }));

  const myRank = board.findIndex(u => u.isCurrentUser) + 1;
  res.json({ success: true, data: { board, myRank } });
};

// ─── Daily Missions ───────────────────────────────────────────────────────────
export const getDailyMissions = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySessions, todayResumes] = await Promise.all([
    Interview.find({ userId: req.userId, createdAt: { $gte: today }, status: 'completed' }).lean(),
    (await import('../models/Resume')).Resume.find({ userId: req.userId, createdAt: { $gte: today } }).lean(),
  ]);

  const hasVoice   = todaySessions.some((s: any) => s.inputMode === 'voice');
  const maxScore   = todaySessions.length ? Math.max(...todaySessions.map(s => s.overallScore)) : 0;
  const hasResume  = todayResumes.length > 0;
  // Replay: user has >1 completed interview ever (meaning they can replay), and visited today
  const hasReplay  = todaySessions.length > 0;

  const missions = MISSIONS.map(m => {
    let completed = false;
    let progress  = 0;
    const total   = 1;

    switch (m.type) {
      case 'interview': completed = todaySessions.length >= 1; progress = Math.min(todaySessions.length, 1); break;
      case 'score':     completed = maxScore >= 75;            progress = completed ? 1 : 0;                 break;
      case 'voice':     completed = hasVoice;                  progress = hasVoice ? 1 : 0;                 break;
      case 'resume':    completed = hasResume;                 progress = hasResume ? 1 : 0;                break;
      case 'replay':    completed = hasReplay;                 progress = hasReplay ? 1 : 0;                break;
    }

    return { id: m.id, icon: m.icon, title: m.title, desc: m.desc, xp: m.xp, type: m.type, completed, progress, total };
  });

  const totalXPToday = missions.filter(m => m.completed).reduce((s, m) => s + m.xp, 0);
  res.json({ success: true, data: { missions, totalXPToday, date: today.toISOString() } });
};


// ─── Badges ───────────────────────────────────────────────────────────────────
export const getBadges = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select('-password');
  const sessions = await Interview.find({ userId: req.userId, status: 'completed' });

  const totalSessions  = sessions.length;
  const maxScore       = sessions.length ? Math.max(...sessions.map(s => s.overallScore)) : 0;
  const streak         = user?.streak || 0;
  const level          = user?.level || 1;
  const uniqueModes    = new Set(sessions.map(s => s.mode)).size;

  const badges = BADGES.map(b => ({
    ...b,
    earned: b.condition(totalSessions, maxScore, streak, uniqueModes, level),
  }));

  const earned = badges.filter(b => b.earned).length;
  res.json({ success: true, data: { badges, earned, total: BADGES.length } });
};
