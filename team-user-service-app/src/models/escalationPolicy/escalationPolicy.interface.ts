import mongoose, { Document, Model } from "mongoose";

export interface IEscalationStep {
  order: number;
  timeoutMinutes: number;
  escalationType: "user" | "team";
  escalationTargetId: mongoose.Types.ObjectId;
}

export interface IEscalationPolicy extends Document {
  teamId: mongoose.Types.ObjectId;
  policyName: string;
  escalationSteps: IEscalationStep[];
  version: number;
  isLatest: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  getNextStep(currentOrder: number): IEscalationStep | null;
  softDelete(): Promise<void>;
  validateSteps(): boolean;
}

export interface IEscalationPolicyModel extends Model<IEscalationPolicy> {
  findLatestByTeam(
    teamId: mongoose.Types.ObjectId
  ): Promise<IEscalationPolicy | null>;
  findVersion(
    teamId: mongoose.Types.ObjectId,
    version: number
  ): Promise<IEscalationPolicy | null>;
  createNewVersion(
    teamId: mongoose.Types.ObjectId,
    updates: Partial<IEscalationPolicy>
  ): Promise<IEscalationPolicy>;
  rollbackToVersion(
    teamId: mongoose.Types.ObjectId,
    version: number
  ): Promise<IEscalationPolicy | null>;
  permanentlyDeleteOld(days?: number): Promise<number>;
}
