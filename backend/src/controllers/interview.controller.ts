import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Interview } from '../models/Interview';
import { User } from '../models/User';
import { AppError } from '../middleware/error.middleware';
import { callNvidia, parseJSON } from '../services/nvidia.service';

// ─── Start Session ────────────────────────────────────────────────────────────
export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, mode, companyCategory, company, difficulty, inputMode, jobDescription } = req.body;
  if (!role || !mode || !companyCategory || !company || !difficulty) {
    throw new AppError('role, mode, companyCategory, company, difficulty are required');
  }

  const session = await Interview.create({
    userId: req.userId,
    role, mode, companyCategory, company, difficulty,
    inputMode: inputMode || 'text',
    jobDescription,
    status: 'in_progress',
  });

  res.status(201).json({ success: true, data: session });
};

// ─── Submit Answer & Get Feedback ────────────────────────────────────────────
export const submitAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sessionId, questionId, questionText, answerText, timeTaken } = req.body;
  if (!sessionId || !questionText || !answerText) {
    throw new AppError('sessionId, questionText, and answerText are required');
  }

  const session = await Interview.findOne({ _id: sessionId, userId: req.userId });
  if (!session) throw new AppError('Session not found', 404);
  if (session.status === 'completed') throw new AppError('Session already completed');

  const systemPrompt = `You are an expert interview coach and evaluator with deep expertise in ${session.mode} interviews for ${session.role} positions. Evaluate the candidate's answer STRICTLY and ACCURATELY based on the actual content provided.

Scoring Rubric (0-10 scale):
- grammar (0-10): Assess sentence structure, vocabulary, tense usage, and verbal clarity. 9-10 = flawless. 7-8 = minor errors. 5-6 = noticeable errors that affect clarity. Below 5 = significant issues.
- communication (0-10): Assess how clearly and concisely the point is communicated. Does it directly answer the question? Is it well-organized? 9-10 = crystal clear with excellent structure. 5-6 = somewhat clear but disorganized.
- confidence (0-10): Based on language used — hedging phrases like "I think maybe", "I'm not sure", "sort of" reduce this score. Direct, assertive statements increase it.
- technicalAccuracy (0-10): For technical roles, assess correctness of technical claims. For behavioral questions, assess relevance and depth of the answer. 0 if completely wrong/irrelevant.
- starScore (0-10): Does the answer follow Situation → Task → Action → Result structure? 10 = perfect STAR. 0 = no structure whatsoever. Partial credit for partial structure.
- overall (0-10): Weighted average: grammar(15%) + communication(25%) + confidence(15%) + technicalAccuracy(25%) + starScore(20%). Round to 1 decimal.
- suggestions: Give 2-3 SPECIFIC improvements based on WHAT THE CANDIDATE ACTUALLY SAID. Quote their words if needed.
- idealAnswer: Write a model answer for this exact question in the context of the role and company. Make it concrete with specifics.
- whyBetter: Explain in 1-2 sentences specifically what makes the ideal answer better than what the candidate said.

Return ONLY valid JSON — no markdown, no explanation:
{
  "grammar": number,
  "communication": number,
  "confidence": number,
  "technicalAccuracy": number,
  "starScore": number,
  "overall": number,
  "suggestions": string[],
  "idealAnswer": string,
  "whyBetter": string
}`;

  const userPrompt = `Interview Context:
- Role: ${session.role}
- Interview Type: ${session.mode} (${session.difficulty} difficulty)
- Company: ${session.company} (${session.companyCategory})
${session.jobDescription ? `- Job Description context: ${session.jobDescription.substring(0, 300)}` : ''}

Question asked: "${questionText}"

Candidate's Answer: "${answerText}"

Evaluate this answer strictly and honestly. If the answer is short or vague, reflect that in low scores.`;

  const aiResponse = await callNvidia(systemPrompt, userPrompt);
  const feedback = parseJSON(aiResponse, {
    grammar: 6, communication: 6, confidence: 6, technicalAccuracy: 6,
    starScore: 5, overall: 6, suggestions: ['Practice the STAR method'],
    idealAnswer: 'A strong structured answer with specific examples and outcomes.',
    whyBetter: 'More specific, uses STAR structure, quantifies impact.',
  });

  const answer = {
    questionId: questionId || new mongoose.Types.ObjectId().toString(),
    questionText,
    answerText,
    feedback: {
      grammar: feedback.grammar,
      communication: feedback.communication,
      confidence: feedback.confidence,
      technicalAccuracy: feedback.technicalAccuracy,
      starScore: feedback.starScore,
      overall: feedback.overall,
      suggestions: feedback.suggestions || [],
    },
    idealAnswer: feedback.idealAnswer || '',
    whyBetter: feedback.whyBetter || '',
    timeTaken: timeTaken || 0,
  };

  session.answers.push(answer as never);
  await session.save();

  res.json({ success: true, data: { answer, sessionId } });
};

// ─── Evaluate All Answers at Once (new bulk flow) ─────────────────────────────
export const evaluateAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sessionId, answers: rawAnswers, duration } = req.body;
  // rawAnswers: Array<{ questionText: string; answerText: string; timeTaken: number }>
  if (!sessionId || !Array.isArray(rawAnswers) || rawAnswers.length === 0) {
    throw new AppError('sessionId and answers[] are required');
  }

  const session = await Interview.findOne({ _id: sessionId, userId: req.userId });
  if (!session) throw new AppError('Session not found', 404);
  if (session.status === 'completed') throw new AppError('Session already completed');

  const evalSystemPrompt = `You are an expert interview coach evaluating a candidate's answer for a ${session.mode} interview for the ${session.role} role at ${session.company}.

Scoring Rubric (0-10 scale):
- grammar: Sentence structure, vocabulary, clarity. 9-10=flawless, 7-8=minor errors, <5=significant issues.
- communication: Clarity, conciseness, directly answers the question. 9-10=crystal clear, 5-6=disorganized.
- confidence: Assertive language vs hedging. Direct statements = higher. Phrases like "I think maybe" = lower.
- technicalAccuracy: Correctness of technical claims / depth for behavioral answers. 0 if wrong/irrelevant.
- starScore: Situation→Task→Action→Result. 10=perfect STAR. 0=no structure.
- overall: Weighted avg: grammar(15%)+communication(25%)+confidence(15%)+technicalAccuracy(25%)+starScore(20%). Round to 1 decimal.
- suggestions: 2-3 SPECIFIC improvements quoting the candidate's actual words.
- idealAnswer: Model answer for this exact question and role.
- whyBetter: 1-2 sentences on what makes ideal better.

Return ONLY valid JSON — no markdown:
{"grammar":number,"communication":number,"confidence":number,"technicalAccuracy":number,"starScore":number,"overall":number,"suggestions":string[],"idealAnswer":string,"whyBetter":string}`;

  // Evaluate every answer in parallel
  const evaluated = await Promise.all(
    rawAnswers.map(async (a: { questionText: string; answerText: string; timeTaken?: number }) => {
      const userPrompt = `Interview Context: Role=${session.role}, Type=${session.mode} (${session.difficulty}), Company=${session.company}${session.jobDescription ? `, JD context: ${session.jobDescription.substring(0, 300)}` : ''}\n\nQuestion: "${a.questionText}"\nCandidate Answer: "${a.answerText}"\n\nEvaluate strictly and honestly. Short/vague answers should score low.`;
      const aiRaw = await callNvidia(evalSystemPrompt, userPrompt);
      const fb = parseJSON(aiRaw, {
        grammar: 6, communication: 6, confidence: 6, technicalAccuracy: 6,
        starScore: 5, overall: 6, suggestions: ['Practice the STAR method'],
        idealAnswer: 'A strong structured answer with specific examples and outcomes.',
        whyBetter: 'More specific, uses STAR structure, quantifies impact.',
      });
      return {
        questionId: new mongoose.Types.ObjectId().toString(),
        questionText: a.questionText,
        answerText: a.answerText,
        feedback: {
          grammar: fb.grammar,
          communication: fb.communication,
          confidence: fb.confidence,
          technicalAccuracy: fb.technicalAccuracy,
          starScore: fb.starScore,
          overall: fb.overall,
          suggestions: fb.suggestions || [],
        },
        idealAnswer: fb.idealAnswer || '',
        whyBetter: fb.whyBetter || '',
        timeTaken: a.timeTaken || 0,
      };
    })
  );

  // Persist answers
  session.answers = evaluated as never[];

  // Calculate overall score (0-100)
  const scores = evaluated.map(a => a.feedback.overall);
  session.overallScore = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10);

  // Generate improvement plan from all answers
  const detailedSummary = evaluated
    .map(a => `Q: ${a.questionText}\nAnswer: ${a.answerText.substring(0, 200)}\nGrammar:${a.feedback.grammar}/10 Comm:${a.feedback.communication}/10 Tech:${a.feedback.technicalAccuracy}/10 STAR:${a.feedback.starScore}/10 Overall:${a.feedback.overall}/10`)
    .join('\n\n');

  const planSystem = `You are a professional career coach. Based on all interview answers, generate a specific personalized improvement plan.
Return ONLY valid JSON: {"weakAreas":string[],"improvementPlan":string[]}
- weakAreas: 3-5 specific skills where scores were lowest (e.g. "STAR Method Structuring", "Technical Depth").
- improvementPlan: 4-6 concrete, actionable steps with resources. Each step addresses a weak area.`;

  const planRaw = await callNvidia(planSystem, `Role: ${session.role} | Type: ${session.mode} | Difficulty: ${session.difficulty}\n\n${detailedSummary}`);
  const plan = parseJSON(planRaw, {
    weakAreas: ['STAR Method', 'Technical Depth'],
    improvementPlan: ['Practice daily with STAR method', 'Study core concepts'],
  });

  session.weakAreas = plan.weakAreas || [];
  session.improvementPlan = plan.improvementPlan || [];
  session.status = 'completed';
  session.duration = duration || 0;

  const xpEarned = Math.round(session.overallScore * 1.5 + evaluated.length * 5);
  session.xpEarned = xpEarned;
  await session.save();

  // Award XP + update level
  const user = await User.findById(req.userId);
  const currentXP = (user?.xp || 0) + xpEarned;
  const newLevel  = Math.floor(currentXP / 100) + 1;
  await User.findByIdAndUpdate(req.userId, { $inc: { xp: xpEarned }, $set: { level: newLevel } });

  res.json({ success: true, data: session });
};


// ─── Get Follow-up Question ───────────────────────────────────────────────────
export const getFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sessionId, lastQuestion, lastAnswer } = req.body;
  const session = await Interview.findOne({ _id: sessionId, userId: req.userId });
  if (!session) throw new AppError('Session not found', 404);

  const systemPrompt = `You are an expert interviewer conducting a ${session.mode} interview for a ${session.role} position at ${session.company}.
Generate 1 intelligent follow-up question based on the candidate's previous answer.
Return ONLY valid JSON: { "question": string, "reason": string }`;

  const userPrompt = `Previous question: "${lastQuestion}"\nCandidate answered: "${lastAnswer}"`;
  const aiResponse = await callNvidia(systemPrompt, userPrompt);

  const data = parseJSON(aiResponse, {
    question: 'Can you elaborate on that with a specific example?',
    reason: 'Follow-up for more detail',
  });

  res.json({ success: true, data });
};

// ─── Complete Session ─────────────────────────────────────────────────────────
export const completeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await Interview.findOne({ _id: req.params.id, userId: req.userId });
  if (!session) throw new AppError('Session not found', 404);

  // Calculate overall score
  if (session.answers.length > 0) {
    const scores = session.answers.map((a: any) => a.feedback.overall);
    session.overallScore = Math.round((scores.reduce((s: number, v: number) => s + v, 0) / scores.length) * 10);
  }

  // AI improvement plan
  const answerSummary = session.answers
    .map((a: any) => `Q: ${a.questionText}\nScore: ${a.feedback.overall}/10`)
    .join('\n');

  const systemPrompt = `You are a professional career coach. Based on the candidate's interview performance data, generate a specific, personalized improvement plan.
Return ONLY valid JSON: { "weakAreas": string[], "improvementPlan": string[] }
- weakAreas: 3-5 specific skills or areas where the scores were lowest. Be specific (e.g., "STAR Method Structuring", "Technical Depth in System Design", not just "communication").
- improvementPlan: 4-6 concrete, actionable steps with specific resources or techniques. Each step should directly address one of the weak areas.`;

  const detailedSummary = session.answers
    .map((a: any) => `Q: ${a.questionText}\nAnswer: ${a.answerText.substring(0, 200)}\nScores — Grammar: ${a.feedback.grammar}/10, Communication: ${a.feedback.communication}/10, Technical: ${a.feedback.technicalAccuracy}/10, STAR: ${a.feedback.starScore}/10, Overall: ${a.feedback.overall}/10`)
    .join('\n\n');

  const aiResponse = await callNvidia(systemPrompt, `Role: ${session.role} | Type: ${session.mode} | Difficulty: ${session.difficulty}\n\nAnswer Performance:\n${detailedSummary}`);
  const plan = parseJSON(aiResponse, {
    weakAreas: ['STAR Method', 'Technical Depth'],
    improvementPlan: ['Practice daily with STAR method', 'Study core concepts'],
  });

  session.weakAreas = plan.weakAreas || [];
  session.improvementPlan = plan.improvementPlan || [];
  session.status = 'completed';
  session.duration = req.body.duration || 0;

  // Award XP
  const xpEarned = Math.round(session.overallScore * 1.5 + session.answers.length * 5);
  session.xpEarned = xpEarned;
  await session.save();

  // Update user XP
  await User.findByIdAndUpdate(req.userId, {
    $inc: { xp: xpEarned },
    $set: { level: Math.floor(xpEarned / 100) + 1 },
  });

  res.json({ success: true, data: session });
};

// ─── Get Session ──────────────────────────────────────────────────────────────
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await Interview.findOne({ _id: req.params.id, userId: req.userId });
  if (!session) throw new AppError('Session not found', 404);
  res.json({ success: true, data: session });
};

// ─── Get History ──────────────────────────────────────────────────────────────
export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 10, mode, role } = req.query;
  const filter: Record<string, unknown> = { userId: req.userId, status: 'completed' };
  if (mode) filter.mode = mode;
  if (role) filter.role = role;

  const sessions = await Interview.find(filter)
    .select('-answers')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Interview.countDocuments(filter);
  res.json({ success: true, data: sessions, total, page: Number(page) });
};

// ─── Get Replay ───────────────────────────────────────────────────────────────
export const getReplay = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await Interview.findOne({
    _id: req.params.id,
    userId: req.userId,
    status: 'completed',
  });
  if (!session) throw new AppError('Completed session not found', 404);

  // Replay: return questions + answers + feedback + ideal answers
  const replay = session.answers.map((a: any, idx: number) => ({
    index: idx + 1,
    questionText: a.questionText,
    answerText: a.answerText,
    feedback: a.feedback,
    idealAnswer: a.idealAnswer,
    whyBetter: a.whyBetter,
    timeTaken: a.timeTaken,
  }));

  res.json({
    success: true,
    data: {
      sessionId: session._id,
      role: session.role,
      mode: session.mode,
      company: session.company,
      difficulty: session.difficulty,
      overallScore: session.overallScore,
      duration: session.duration,
      createdAt: session.createdAt,
      replay,
    },
  });
};
