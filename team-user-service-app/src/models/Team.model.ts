import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
    name: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
};


const TeamSchema = new Schema<ITeam>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, trim: true },
    }, 
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'teams',
    }
);

TeamSchema.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        delete ret._id;
        delete ret.__v;
    },
});


export const Team = mongoose.model<ITeam>('Team', TeamSchema);