import mongoose from "mongoose";
import {
  IOnCallSchedule,
  IOnCallScheduleModel,
} from "./onCallSchedule.interface";
import { OnCallScheduleSchema } from "./onCallSchedule.schema";
import "./onCallSchedule.middleware";

// --- Instance Methods ---
OnCallScheduleSchema.methods.isActive = function (): boolean {
  const now = new Date();
  return !this.isDeleted && this.startTime <= now && this.endTime >= now;
};

OnCallScheduleSchema.methods.softDelete = async function (): Promise<void> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

OnCallScheduleSchema.methods.overlapsWith = function (
  otherStart: Date,
  otherEnd: Date,
  graceMinutes = 5
): boolean {
  const graceMs = graceMinutes * 60 * 1000;
  const adjustedStart = new Date(this.startTime.getTime() - graceMs);
  const adjustedEnd = new Date(this.endTime.getTime() + graceMs);
  return adjustedStart < otherEnd && adjustedEnd > otherStart;
};

// --- Static Methods ---
OnCallScheduleSchema.statics.findActiveByTeam = function (
  teamId: mongoose.Types.ObjectId
) {
  return this.find({
    teamId,
    isDeleted: false,
    endTime: { $gte: new Date() },
  }).sort({ priorityLevel: 1, startTime: 1 });
};

OnCallScheduleSchema.statics.findCurrentSchedule = function (
  teamId: mongoose.Types.ObjectId,
  date = new Date()
) {
  return this.findOne({
    teamId,
    isDeleted: false,
    startTime: { $lte: date },
    endTime: { $gte: date },
  }).populate("userId", "fullName email");
};

OnCallScheduleSchema.statics.permanentlyDeleteOld = async function (days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const result = await this.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: cutoff },
  });
  return result.deletedCount || 0;
};

// --- Model Export ---
export const OnCallScheduleModel = mongoose.model<
  IOnCallSchedule,
  IOnCallScheduleModel
>("OnCallSchedule", OnCallScheduleSchema);
