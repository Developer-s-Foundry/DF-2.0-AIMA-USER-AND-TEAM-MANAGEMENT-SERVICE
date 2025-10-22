import mongoose from "mongoose";
import {
  IEscalationPolicyModel,
  IEscalationPolicy,
} from "./escalationPolicy.interface";
import { EscalationPolicySchema } from "./escalationPolicy.schema";

const statics: Partial<IEscalationPolicyModel> = {
  async findLatestByTeam(
    this: IEscalationPolicyModel,
    teamId: mongoose.Types.ObjectId
  ) {
    return this.findOne({ teamId, isLatest: true, isDeleted: false }).exec();
  },

  async findVersion(
    this: IEscalationPolicyModel,
    teamId: mongoose.Types.ObjectId,
    version: number
  ) {
    return this.findOne({ teamId, version, isDeleted: false }).exec();
  },

  async createNewVersion(
    this: IEscalationPolicyModel,
    teamId: mongoose.Types.ObjectId,
    updates: Partial<IEscalationPolicy>
  ) {
    const latest = await this.findOne({ teamId, isLatest: true });
    if (latest) {
      latest.isLatest = false;
      await latest.save();
    }

    // Build new doc payload: start from latest.toObject() if exists, then apply updates
    const base = latest
      ? (latest.toObject() as Partial<IEscalationPolicy>)
      : {};
    const payload = {
      ...base,
      ...updates,
      _id: new mongoose.Types.ObjectId(),
      teamId,
      version: (latest?.version || 0) + 1,
      isLatest: true,
      isDeleted: false,
      deletedAt: null,
    } as any;

    // Ensure required fields exist on payload
    if (!payload.policyName)
      payload.policyName = updates.policyName || base.policyName || "policy";
    if (!payload.escalationSteps)
      payload.escalationSteps =
        updates.escalationSteps || base.escalationSteps || [];

    const created = new this(payload);
    await created.save();
    return created as IEscalationPolicy;
  },

  async rollbackToVersion(
    this: IEscalationPolicyModel,
    teamId: mongoose.Types.ObjectId,
    version: number
  ) {
    const target = await this.findOne({ teamId, version });
    if (!target)
      throw new Error(`Version ${version} not found for team ${teamId}`);
    // Create a new version that mirrors target
    return this.createNewVersion(teamId, {
      policyName: target.policyName,
      escalationSteps: target.escalationSteps as any,
    } as Partial<IEscalationPolicy>);
  },

  async permanentlyDeleteOld(this: IEscalationPolicyModel, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const result = await this.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: cutoff },
    }).exec();
    return result.deletedCount || 0;
  },
};

// Attach statics to schema (use `as any` to satisfy TS/Mongoose mismatch)
Object.assign(EscalationPolicySchema.statics, statics as any);
