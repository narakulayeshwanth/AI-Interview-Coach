import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { callNvidia, parseJSON } from '../services/nvidia.service';
import { Resume } from '../models/Resume';

// ─── Cover Letter Generator ────────────────────────────────────────────────────
export const generateCoverLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  const { jobDescription, companyName, role, tone = 'professional' } = req.body;
  const resume = await Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 });

  const systemPrompt = `You are an expert career coach and professional writer.
Generate a highly personalized, compelling cover letter. Return ONLY valid JSON:
{
  "coverLetter": string,
  "subjectLine": string,
  "highlights": string[],
  "tipsForCustomization": string[]
}`;

  const userPrompt = `Write a ${tone} cover letter for:
- Role: ${role}
- Company: ${companyName}
- Candidate Skills: ${resume?.extractedSkills?.join(', ') || 'Full Stack Development, Problem Solving'}
- ATS Score of Resume: ${resume?.atsScore || 70}%
- Job Description: ${jobDescription?.slice(0, 800) || 'Software engineering role requiring strong technical and communication skills'}

Make it personalized, achievement-focused, and ATS-optimized. Keep it to 3-4 paragraphs.`;

  const aiResponse = await callNvidia(systemPrompt, userPrompt);
  const result = parseJSON(aiResponse, {
    coverLetter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role} position at ${companyName}. With my expertise in ${resume?.extractedSkills?.slice(0, 3).join(', ') || 'software development'}, I am confident I can make a significant contribution to your team.\n\nThroughout my career, I have consistently delivered high-quality solutions and collaborated effectively with cross-functional teams. I am particularly drawn to ${companyName}'s innovative approach and would love the opportunity to contribute to your mission.\n\nThank you for considering my application. I look forward to discussing how my skills align with your needs.\n\nBest regards`,
    subjectLine: `Application for ${role} Position — ${companyName}`,
    highlights: ['Strong technical alignment with job requirements', 'Demonstrated problem-solving ability', 'Collaborative team player'],
    tipsForCustomization: ['Add a specific achievement with numbers (e.g. "increased performance by 40%")', `Research ${companyName}'s recent news and mention it`, 'Customize the opening line to mention how you found the role'],
  });

  res.json({ success: true, data: result });
};
