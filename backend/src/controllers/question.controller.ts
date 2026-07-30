import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Question } from '../models/Question';
import { AppError } from '../middleware/error.middleware';
import { callNvidia, parseJSON } from '../services/nvidia.service';

// ─── Get Questions from DB ────────────────────────────────────────────────────
export const getQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { mode, role, difficulty, company, limit = 10 } = req.query;
  const filter: Record<string, unknown> = {};
  if (mode) filter.mode = mode;
  if (role) filter.role = role;
  if (difficulty) filter.difficulty = difficulty;
  if (company) filter.company = company;

  const questions = await Question.find(filter)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ success: true, data: questions, count: questions.length });
};

// ─── AI Generate Questions ────────────────────────────────────────────────────
export const generateQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, mode, difficulty, company, companyCategory, jobDescription, count = 8 } = req.body;
  if (!role || !mode || !difficulty) throw new AppError('role, mode, and difficulty are required');

  const systemPrompt = `You are an expert technical interviewer. Generate realistic interview questions.
Return ONLY valid JSON:
{
  "questions": [
    {
      "text": string,
      "difficulty": "${difficulty}",
      "tags": string[],
      "idealAnswer": string
    }
  ]
}`;

  const jdContext = jobDescription
    ? `\nThis interview is specifically tailored to this job description:\n${jobDescription.substring(0, 1000)}`
    : '';

  const userPrompt = `Generate ${count} ${difficulty} ${mode} interview questions for a ${role} position at ${company} (${companyCategory} company).${jdContext}
Make questions realistic, specific, and varied. Include behavioral, technical, and situational questions appropriate for ${mode} interviews.`;

  const aiResponse = await callNvidia(systemPrompt, userPrompt);
  const data = parseJSON(aiResponse, { questions: [] });

  res.json({ success: true, data: data.questions || [] });
};
