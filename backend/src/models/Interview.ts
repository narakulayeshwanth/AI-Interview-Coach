import mongoose, { Schema, Document } from 'mongoose';

const AnswerFeedbackSchema = new Schema(
  {
    grammar: { type: Number, min: 0, max: 10, default: 0 },
    communication: { type: Number, min: 0, max: 10, default: 0 },
    confidence: { type: Number, min: 0, max: 10, default: 0 },
    technicalAccuracy: { type: Number, min: 0, max: 10, default: 0 },
    starScore: { type: Number, min: 0, max: 10, default: 0 },
    overall: { type: Number, min: 0, max: 10, default: 0 },
    suggestions: [{ type: String }],
  },
  { _id: false }
);

const AnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    answerText: { type: String, required: true },
    feedback: { type: AnswerFeedbackSchema, required: true },
    idealAnswer: { type: String, default: '' },
    whyBetter: { type: String, default: '' },
    timeTaken: { type: Number, default: 0 },
  },
  { _id: false }
);

export interface IInterviewDoc extends Document {
  userId: mongoose.Types.ObjectId;
  role: string;
  mode: string;
  companyCategory: string;
  company: string;
  difficulty: string;
  inputMode: 'text' | 'voice';
  jobDescription?: string;
  answers: typeof AnswerSchema[];
  overallScore: number;
  weakAreas: string[];
  improvementPlan: string[];
  duration: number;
  status: 'in_progress' | 'completed';
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterviewDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    mode: { type: String, required: true },
    companyCategory: { type: String, required: true },
    company: { type: String, required: true },
    difficulty: { type: String, required: true },
    inputMode: { type: String, enum: ['text', 'voice'], default: 'text' },
    jobDescription: { type: String },
    answers: [AnswerSchema],
    overallScore: { type: Number, default: 0 },
    weakAreas: [{ type: String }],
    improvementPlan: [{ type: String }],
    duration: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Interview = mongoose.model<IInterviewDoc>('Interview', InterviewSchema);
