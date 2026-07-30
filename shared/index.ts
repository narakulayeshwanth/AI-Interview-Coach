// ─── User ───────────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  targetRole: string;
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior';
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string;
  createdAt: string;
}

// ─── Resume ─────────────────────────────────────────────
export interface IResumeAnalysis {
  _id: string;
  userId: string;
  fileName: string;
  atsScore: number;
  grammarScore: number;
  keywordScore: number;
  skillMatchScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D';
  extractedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  formattingFeedback: string[];
  actionVerbsFeedback: string;
  rawText: string;
  createdAt: string;
}

export interface IJDMatch {
  jdText: string;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
}

// ─── Interview ───────────────────────────────────────────
export type InterviewMode =
  | 'hr'
  | 'technical'
  | 'behavioral'
  | 'managerial'
  | 'system_design'
  | 'group_discussion';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type CompanyCategory =
  | 'faang'
  | 'product'
  | 'service'
  | 'startup'
  | 'government'
  | 'internship'
  | 'campus';

export interface IQuestion {
  _id: string;
  text: string;
  mode: InterviewMode;
  role: string;
  company?: string;
  companyCategory?: CompanyCategory;
  difficulty: Difficulty;
  idealAnswer?: string;
  tags: string[];
}

export interface IAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  feedback: IAnswerFeedback;
  idealAnswer: string;
  whyBetter: string;
  timeTaken: number; // seconds
}

export interface IAnswerFeedback {
  grammar: number;
  communication: number;
  confidence: number;
  technicalAccuracy: number;
  starScore: number;
  overall: number;
  suggestions: string[];
}

export interface IInterviewSession {
  _id: string;
  userId: string;
  role: string;
  mode: InterviewMode;
  companyCategory: CompanyCategory;
  company: string;
  difficulty: Difficulty;
  inputMode: 'text' | 'voice';
  answers: IAnswer[];
  overallScore: number;
  weakAreas: string[];
  improvementPlan: string[];
  duration: number; // seconds
  status: 'in_progress' | 'completed';
  createdAt: string;
}

// ─── Dashboard ──────────────────────────────────────────
export interface IDashboardStats {
  readinessPercent: number;
  resumeScore: number;
  totalSessions: number;
  avgScore: number;
  streak: number;
  weakAreas: string[];
  strongAreas: string[];
  radarData: { skill: string; score: number }[];
  chartData: { date: string; score: number }[];
}

// ─── API Responses ──────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
