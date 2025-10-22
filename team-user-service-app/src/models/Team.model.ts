import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  created_by?: string; 
  created_at: Date;
  updated_at: Date;
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    created_by: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'teams',
  }
);

TeamSchema.index({ name: 1 });

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
