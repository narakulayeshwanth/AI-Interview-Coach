import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { callNvidia, parseJSON } from '../services/nvidia.service';

const RESOURCE_DB: Record<string, { youtube: any[]; articles: any[]; leetcode: any[]; }> = {
  'STAR Method': {
    youtube: [
      { title: 'STAR Method Interview Technique', channel: 'Don Georgevich', url: 'https://youtube.com/watch?v=CCqvu3V5mhY', duration: '12 min' },
      { title: 'How to Answer Behavioral Questions', channel: 'Jeff H Sipe', url: 'https://youtube.com/watch?v=e5HO7fkG49E', duration: '18 min' },
    ],
    articles: [
      { title: 'STAR Method: A Complete Guide', source: 'The Muse', url: 'https://themuse.com/advice/star-interview-method' },
      { title: 'Behavioral Interview Questions & STAR Answers', source: 'Indeed', url: 'https://indeed.com/career-advice/interviewing/star-interview-questions' },
    ],
    leetcode: [],
  },
  'Technical Depth': {
    youtube: [
      { title: 'System Design Interview – Step by Step Guide', channel: 'Gaurav Sen', url: 'https://youtube.com/watch?v=0163cssUxLA', duration: '45 min' },
      { title: 'Data Structures Easy to Advanced Course', channel: 'freeCodeCamp', url: 'https://youtube.com/watch?v=RBSGKlAvoiM', duration: '8 hr' },
    ],
    articles: [
      { title: 'System Design Primer', source: 'GitHub', url: 'https://github.com/donnemartin/system-design-primer' },
      { title: 'Tech Interview Handbook', source: 'GitHub', url: 'https://techinterviewhandbook.org' },
    ],
    leetcode: [
      { title: 'Top 150 Interview Questions', difficulty: 'Mixed', url: 'https://leetcode.com/studyplan/top-interview-150/', problems: 150 },
      { title: 'Blind 75', difficulty: 'Mixed', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions', problems: 75 },
    ],
  },
  'Communication': {
    youtube: [
      { title: 'Improve Your Communication Skills', channel: 'Charisma on Command', url: 'https://youtube.com/watch?v=HAnw168huqA', duration: '10 min' },
      { title: 'How to Speak Clearly and Confidently', channel: 'Practical Psychology', url: 'https://youtube.com/watch?v=MUCfmMpMFuQ', duration: '14 min' },
    ],
    articles: [
      { title: '10 Ways to Improve Your Communication Skills', source: 'HBR', url: 'https://hbr.org/2023/communication-skills' },
    ],
    leetcode: [],
  },
};

// ─── AI Learning Hub ──────────────────────────────────────────────────────────
export const getLearningHub = async (req: AuthRequest, res: Response): Promise<void> => {
  const { weakAreas = [], role = 'Software Developer', topic } = req.body;

  const systemPrompt = `You are an expert learning curator for software engineers and job seekers.
Generate a personalized learning resource list. Return ONLY valid JSON:
{
  "topics": [
    {
      "name": string,
      "priority": "high"|"medium"|"low",
      "youtube": [{ "title": string, "channel": string, "url": string, "duration": string }],
      "articles": [{ "title": string, "source": string, "url": string }],
      "leetcode": [{ "title": string, "difficulty": string, "url": string, "problems": number }],
      "roadmap": string,
      "estimatedTime": string
    }
  ]
}`;

  const areas = topic ? [topic] : (weakAreas.length ? weakAreas.slice(0, 4) : ['DSA', 'System Design', 'Communication']);

  // Try to serve from local DB first, then use AI for unknowns
  const localTopics = areas.map((area: string) => {
    const local = RESOURCE_DB[area];
    if (local) {
      return {
        name: area, priority: 'high',
        youtube: local.youtube, articles: local.articles, leetcode: local.leetcode,
        roadmap: `Focus on mastering ${area} through structured practice and real examples.`,
        estimatedTime: '2-3 weeks',
      };
    }
    return null;
  }).filter(Boolean);

  const unknownAreas = areas.filter((a: string) => !RESOURCE_DB[a]);

  let aiTopics: any[] = [];
  if (unknownAreas.length > 0) {
    const userPrompt = `Generate learning resources for a ${role} candidate who needs to improve in: ${unknownAreas.join(', ')}`;
    const aiResponse = await callNvidia(systemPrompt, userPrompt);
    const parsed = parseJSON(aiResponse, { topics: [] });
    aiTopics = parsed.topics || [];
  }

  const allTopics = [...localTopics, ...aiTopics];

  res.json({ success: true, data: { topics: allTopics, totalTopics: allTopics.length } });
};
