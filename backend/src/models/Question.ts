import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionDoc extends Document {
  text: string;
  mode: string;
  role: string;
  company?: string;
  companyCategory?: string;
  difficulty: string;
  idealAnswer: string;
  tags: string[];
  isAIGenerated: boolean;
}

const QuestionSchema = new Schema<IQuestionDoc>(
  {
    text: { type: String, required: true },
    mode: { type: String, required: true },
    role: { type: String, required: true },
    company: { type: String },
    companyCategory: { type: String },
    difficulty: { type: String, required: true },
    idealAnswer: { type: String, default: '' },
    tags: [{ type: String }],
    isAIGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

QuestionSchema.index({ mode: 1, role: 1, difficulty: 1 });

export const Question = mongoose.model<IQuestionDoc>('Question', QuestionSchema);
