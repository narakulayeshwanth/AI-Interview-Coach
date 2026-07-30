import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { AuthRequest } from '../middleware/auth.middleware';
import { Resume } from '../models/Resume';
import { AppError } from '../middleware/error.middleware';
import { callNvidia, parseJSON } from '../services/nvidia.service';

// ─── Extract raw text from uploaded file ─────────────────────────────────────
async function extractText(filePath: string, ext: string): Promise<string> {
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  }
  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new AppError('Unsupported file type');
}

// ─── Quick heuristic: does text look like a resume? ──────────────────────────
function looksLikeResume(text: string): { valid: boolean; reason: string } {
  const t = text.toLowerCase().trim();

  // Must have enough content to be a real document
  if (t.length < 150) {
    return { valid: false, reason: 'The uploaded file contains almost no readable text. Please upload a proper resume in PDF or DOCX format.' };
  }

  // Detect image-only PDFs (scanned without OCR) — common for passport scans
  if (t.length < 400 && /^\s*[\d\s\-\/\.]+\s*$/.test(t)) {
    return { valid: false, reason: 'The file appears to be a scanned image without readable text. Please upload a text-based resume PDF or DOCX.' };
  }

  // Must contain at least 2 of these core resume signal groups
  const signals = [
    /\b(experience|employment|work history|career|internship|position|job)\b/i,
    /\b(education|university|college|degree|bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|diploma|school)\b/i,
    /\b(skills|technologies|proficient|expertise|competencies|tools|languages)\b/i,
    /\b(project|projects|portfolio|github|developed|built|implemented|designed)\b/i,
    /\b(email|phone|linkedin|mobile|contact|address)\b/i,
    /\b(resume|curriculum vitae|cv|objective|summary|profile|about me)\b/i,
    /\b(certification|certificate|award|achievement|honor|accomplishment)\b/i,
  ];

  const matched = signals.filter(s => s.test(text));
  if (matched.length < 2) {
    return {
      valid: false,
      reason: 'The uploaded file does not appear to be a resume. It may be an ID, passport, image scan, or an unrelated document. Please upload your actual resume.',
    };
  }

  return { valid: true, reason: '' };
}

// ─── Upload & Analyze ─────────────────────────────────────────────────────────
export const uploadAndAnalyze = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file uploaded');

  const ext = path.extname(req.file.originalname).toLowerCase();
  const rawText = await extractText(req.file.path, ext);

  // ── Step 1: Heuristic validation ─────────────────────────────────────────
  const { valid, reason } = looksLikeResume(rawText);
  if (!valid) {
    // Clean up the uploaded file
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(422).json({
      success: false,
      error: reason,
      code: 'NOT_A_RESUME',
    });
    return;
  }

  // ── Step 2: AI validation (fast check, cheap prompt) ─────────────────────
  const validationPrompt = `You are a document classifier. Read the following text and answer ONLY with a JSON object.
Determine if this text is a professional resume/CV.

Text (first 800 chars):
${rawText.substring(0, 800)}

Reply ONLY with: {"isResume": true} or {"isResume": false, "reason": "one sentence why not"}`;

  try {
    const validationResponse = await callNvidia(
      'You are a strict document classifier. Reply only with JSON.',
      validationPrompt,
    );
    const parsed = parseJSON(validationResponse, { isResume: true as boolean, reason: '' as string });
    if (parsed.isResume === false) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      res.status(422).json({
        success: false,
        error: `This does not appear to be a resume: ${parsed.reason || 'unrecognized document type'}. Please upload your actual resume file.`,
        code: 'NOT_A_RESUME',
      });
      return;
    }
  } catch (_) {
    // If AI validation fails, fall through to main analysis (heuristic already passed)
  }

  const systemPrompt = `You are a senior ATS (Applicant Tracking System) expert and professional resume coach with 15+ years of experience in HR and recruitment. Your analysis must be ACCURATE, SPECIFIC, and based strictly on the actual content of the resume provided.

Scoring Guidelines:
- atsScore (0-100): Evaluate based on: keyword density, standard section headings (Experience, Education, Skills, Summary), no tables/graphics/columns that break ATS parsing, consistent date formats, quantified achievements. Deduct points for fancy formatting, missing sections, or vague descriptions.
- grammarScore (0-100): Check for grammatical errors, tense consistency (past tense for old jobs, present for current), punctuation, spelling, and sentence clarity.
- keywordScore (0-100): Identify industry-relevant keywords actually present vs what's expected for the candidate's apparent target role. Base this on the skills and job titles mentioned.
- skillMatchScore (0-100): Score based on how well the skills section aligns with the candidate's experience and the roles they've held.
- overallGrade: A (90+), B (75-89), C (60-74), D (below 60) — based on average of all scores.
- extractedSkills: List ONLY skills explicitly mentioned in the resume (technical tools, programming languages, domain skills, certifications, soft skills with evidence).
- missingSkills: Based on the candidate's apparent industry/role, list important skills that are absent but commonly required.
- suggestions: Provide 5 SPECIFIC, ACTIONABLE improvements referencing actual content from the resume. Do NOT give generic advice.
- formattingFeedback: 3 specific observations about the resume's formatting based on what you can see.
- actionVerbsFeedback: Comment specifically on the action verbs used in the resume and give concrete alternatives.

Return ONLY valid JSON — no markdown, no explanation, no preamble:
{
  "atsScore": number,
  "grammarScore": number,
  "keywordScore": number,
  "skillMatchScore": number,
  "overallGrade": "A" | "B" | "C" | "D",
  "extractedSkills": string[],
  "missingSkills": string[],
  "suggestions": string[],
  "formattingFeedback": string[],
  "actionVerbsFeedback": string
}`;

  const userPrompt = `Carefully analyze this resume and provide accurate, content-specific feedback. Base ALL scores and feedback on what is actually written in this resume — do not give generic responses:\n\n${rawText.substring(0, 6000)}`;
  const aiResponse = await callNvidia(systemPrompt, userPrompt);

  const analysis = parseJSON(aiResponse, {
    atsScore: 65, grammarScore: 70, keywordScore: 60, skillMatchScore: 65,
    overallGrade: 'C', extractedSkills: [], missingSkills: [],
    suggestions: ['Add more quantified achievements'], formattingFeedback: [],
    actionVerbsFeedback: 'Use stronger action verbs',
  });

  // Normalize fields — AI sometimes returns wrong types
  if (Array.isArray(analysis.actionVerbsFeedback)) {
    analysis.actionVerbsFeedback = (analysis.actionVerbsFeedback as string[]).join(' ');
  }
  if (typeof analysis.actionVerbsFeedback !== 'string') {
    analysis.actionVerbsFeedback = String(analysis.actionVerbsFeedback || '');
  }
  if (!Array.isArray(analysis.extractedSkills)) analysis.extractedSkills = [];
  if (!Array.isArray(analysis.missingSkills))   analysis.missingSkills = [];
  if (!Array.isArray(analysis.suggestions))      analysis.suggestions = [];
  if (!Array.isArray(analysis.formattingFeedback)) analysis.formattingFeedback = [];

  const resume = await Resume.create({
    userId: req.userId,
    fileName: req.file.originalname,
    filePath: req.file.path,
    rawText: rawText.substring(0, 10000),
    ...analysis,
  });

  res.status(201).json({ success: true, data: resume });
};


// ─── Get Analysis ─────────────────────────────────────────────────────────────
export const getAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
  if (!resume) throw new AppError('Resume not found', 404);
  res.json({ success: true, data: resume });
};

// ─── Get User Resumes ─────────────────────────────────────────────────────────
export const getUserResumes = async (req: AuthRequest, res: Response): Promise<void> => {
  const resumes = await Resume.find({ userId: req.userId })
    .select('-rawText -filePath')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: resumes });
};

// ─── JD Matching ─────────────────────────────────────────────────────────────
export const matchJD = async (req: AuthRequest, res: Response): Promise<void> => {
  const { jdText, resumeId } = req.body;
  if (!jdText) throw new AppError('Job description text is required');

  const resume = resumeId
    ? await Resume.findOne({ _id: resumeId, userId: req.userId })
    : await Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 });

  if (!resume) throw new AppError('No resume found. Please upload a resume first.', 404);

  const systemPrompt = `You are a senior technical recruiter and talent acquisition specialist. Your task is to accurately match a candidate's resume against a job description.

Matching Rules:
- extractedSkills: All skills, tools, technologies, and qualifications REQUIRED in the job description.
- preferredSkills: Skills listed as "preferred", "nice to have", or "bonus" in the JD.
- matchedSkills: Skills from the JD that are ACTUALLY PRESENT in the candidate's resume. Be strict — only include genuine matches.
- missingSkills: Required skills from the JD that are clearly absent from the resume.
- matchPercentage: Calculate as (matchedSkills.length / extractedSkills.length) * 100. Round to nearest integer. Be honest — do not inflate this score.
- roleContext: The exact job title/role from the JD.
- experienceLevel: The experience level required (e.g., "3-5 years", "Senior", "Entry-level") as stated in the JD.

Return ONLY valid JSON — no markdown, no explanation:
{
  "extractedSkills": string[],
  "preferredSkills": string[],
  "matchedSkills": string[],
  "missingSkills": string[],
  "matchPercentage": number,
  "roleContext": string,
  "experienceLevel": string
}`;

  const resumeContext = `Candidate Skills: ${resume.extractedSkills.join(', ')}\n\nCandidate Raw Resume (for additional context):\n${(resume.rawText || '').substring(0, 2000)}`;
  const userPrompt = `JOB DESCRIPTION:\n${jdText.substring(0, 3000)}\n\n${resumeContext}`;
  const aiResponse = await callNvidia(systemPrompt, userPrompt);

  const matchData = parseJSON(aiResponse, {
    extractedSkills: [], preferredSkills: [], matchedSkills: [],
    missingSkills: [], matchPercentage: 50, roleContext: 'Unknown', experienceLevel: 'Unknown',
  });

  // Save to resume JD history
  resume.jdMatchHistory.push({
    jdText: jdText.substring(0, 500),
    matchPercentage: matchData.matchPercentage,
    matchedSkills: matchData.matchedSkills,
    missingSkills: matchData.missingSkills,
    createdAt: new Date(),
  });
  await resume.save();

  res.json({ success: true, data: { ...matchData, resumeId: resume._id } });
};
