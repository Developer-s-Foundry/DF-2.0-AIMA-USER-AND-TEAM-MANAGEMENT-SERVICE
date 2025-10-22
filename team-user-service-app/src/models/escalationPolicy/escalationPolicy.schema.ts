import { Schema } from "mongoose";
import {
  IEscalationPolicy,
  IEscalationStep,
} from "./escalationPolicy.interface";

const EscalationStepSchema = new Schema<IEscalationStep>({
  order: { type: Number, required: true },
  timeoutMinutes: { type: Number, required: true },
  escalationType: { type: String, required: true, enum: ["user", "team"] },
  escalationTargetId: { type: Schema.Types.ObjectId, required: true },
});

export const EscalationPolicySchema = new Schema<IEscalationPolicy>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    policyName: { type: String, required: true },
    escalationSteps: [EscalationStepSchema],
    version: { type: Number, default: 1 },
    isLatest: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ============================
// INDEXES
// ============================

EscalationPolicySchema.index({ teamId: 1, version: 1 }, { unique: true });
EscalationPolicySchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 30,
    partialFilterExpression: { isDeleted: true },
  }
);
