import axios from 'axios';
import dns from 'dns';

// Force Google DNS so integrate.api.nvidia.com resolves on any network
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const NVIDIA_BASE = process.env.NVIDIA_API_BASE || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || '';
const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';

const IS_MOCK = !NVIDIA_KEY || NVIDIA_KEY === 'your_nvidia_nim_api_key_here';

// ─── Call NVIDIA NIM ─────────────────────────────────────────────────────────
export async function callNvidia(systemPrompt: string, userPrompt: string): Promise<string> {
  if (IS_MOCK) {
    console.warn('⚠️  NVIDIA_API_KEY not set — returning mock response');
    return getMockResponse(userPrompt);
  }

  const retries = 3;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        `${NVIDIA_BASE}/chat/completions`,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${NVIDIA_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      return response.data.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      const isNetworkError =
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'EADDRINUSE' ||
        err.message?.includes('timeout') ||
        err.response?.status >= 500;

      if (isNetworkError && attempt < retries) {
        console.warn(`⚠️  NVIDIA API call failed (attempt ${attempt}/${retries}): ${err.message || err}. Retrying in 1.5s...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      console.error(`❌ NVIDIA API call failed permanently: ${err.message || err}`);
      throw err;
    }
  }
  return '';
}

// ─── Parse JSON from AI response safely ──────────────────────────────────────
export function parseJSON<T>(text: string, fallback: T): T {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    return JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse AI JSON response:', text.substring(0, 200));
    return fallback;
  }
}

// ─── Mock responses for development ──────────────────────────────────────────
function getMockResponse(prompt: string): string {
  if (prompt.includes('resume') || prompt.includes('ATS')) {
    return JSON.stringify({
      atsScore: 72,
      grammarScore: 85,
      keywordScore: 68,
      skillMatchScore: 75,
      overallGrade: 'B',
      extractedSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Git'],
      missingSkills: ['Docker', 'Kubernetes', 'AWS', 'Redis'],
      suggestions: [
        'Add measurable achievements (e.g., "Improved load time by 40%")',
        'Include Docker/containerization experience if applicable',
        'Quantify your team collaboration and leadership examples',
        'Add a professional summary at the top tailored to the target role',
      ],
      formattingFeedback: [
        'Consider using consistent bullet point style throughout',
        'Ensure date formats are uniform (MM/YYYY or Month YYYY)',
      ],
      actionVerbsFeedback:
        'Good use of action verbs like "Built", "Developed". Avoid passive phrases like "was responsible for".',
    });
  }

  if (prompt.includes('feedback') || prompt.includes('answer')) {
    return JSON.stringify({
      grammar: 7,
      communication: 8,
      confidence: 6,
      technicalAccuracy: 7,
      starScore: 5,
      overall: 6.6,
      suggestions: [
        'Structure your answer using the STAR method (Situation, Task, Action, Result)',
        'Include specific metrics or outcomes to strengthen your answer',
        'Speak more confidently — avoid hedging phrases like "I think maybe"',
      ],
      idealAnswer:
        'A strong answer would clearly outline the specific situation you faced, the task you were assigned, the concrete steps you took (using active voice), and the measurable result you achieved. For example: "At my previous internship, I was tasked with reducing API response times. I identified N+1 query issues and implemented database indexing, reducing response time by 60% and improving user satisfaction scores by 15%."',
      whyBetter:
        'The ideal answer uses specific numbers, follows STAR structure, demonstrates impact on the business, and shows technical depth without being vague.',
    });
  }

  if (prompt.includes('question') || prompt.includes('generate')) {
    return JSON.stringify({
      questions: [
        {
          text: 'Tell me about yourself and your journey into software development.',
          difficulty: 'easy',
          tags: ['introduction', 'background'],
        },
        {
          text: 'Describe a challenging technical problem you solved recently. What was your approach?',
          difficulty: 'medium',
          tags: ['problem-solving', 'technical'],
        },
        {
          text: 'How do you handle disagreements with teammates about technical decisions?',
          difficulty: 'medium',
          tags: ['behavioral', 'teamwork'],
        },
        {
          text: 'Walk me through your most impactful project. What were the technical decisions you made?',
          difficulty: 'hard',
          tags: ['projects', 'architecture'],
        },
        {
          text: 'Where do you see yourself in 3–5 years, and how does this role align with that vision?',
          difficulty: 'easy',
          tags: ['goals', 'culture-fit'],
        },
      ],
    });
  }

  if (prompt.includes('job description') || prompt.includes('JD')) {
    return JSON.stringify({
      extractedSkills: ['React', 'Node.js', 'TypeScript', 'REST APIs', 'MongoDB', 'Git'],
      preferredSkills: ['Docker', 'AWS', 'Redis', 'GraphQL'],
      roleContext: 'Full Stack Developer',
      experienceLevel: 'junior to mid-level',
    });
  }

  if (prompt.includes('improvement') || prompt.includes('report')) {
    return JSON.stringify({
      weakAreas: ['STAR Method Structuring', 'Technical Depth', 'Confidence'],
      improvementPlan: [
        'Practice STAR method daily with common behavioral questions',
        'Deep-dive into system design fundamentals — read "Designing Data-Intensive Applications"',
        'Record yourself answering questions to improve delivery confidence',
        'Focus on data structures & algorithms on LeetCode (Easy → Medium)',
      ],
    });
  }

  return JSON.stringify({ message: 'Mock response — set NVIDIA_API_KEY for real AI responses' });
}
