import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeDoc extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  filePath: string;
  rawText: string;
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
  jdMatchHistory: {
    jdText: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
    createdAt: Date;
  }[];
}

const ResumeSchema = new Schema<IResumeDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    rawText: { type: String, required: true },
    atsScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    skillMatchScore: { type: Number, default: 0 },
    overallGrade: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'C' },
    extractedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    suggestions: [{ type: String }],
    formattingFeedback: [{ type: String }],
    actionVerbsFeedback: { type: String, default: '' },
    jdMatchHistory: [
      {
        jdText: String,
        matchPercentage: Number,
        matchedSkills: [String],
        missingSkills: [String],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Resume = mongoose.model<IResumeDoc>('Resume', ResumeSchema);
