import mongoose, { Document, Model } from "mongoose";

export interface IOnCallSchedule extends Document {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  priorityLevel: number;
  startTime: Date;
  endTime: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isActive(): boolean;
  softDelete(): Promise<void>;
  overlapsWith(
    otherStart: Date,
    otherEnd: Date,
    graceMinutes?: number
  ): boolean;
}

export interface IOnCallScheduleModel extends Model<IOnCallSchedule> {
  // Static methods
  findActiveByTeam(teamId: mongoose.Types.ObjectId): Promise<IOnCallSchedule[]>;
  findCurrentSchedule(
    teamId: mongoose.Types.ObjectId,
    date?: Date
  ): Promise<IOnCallSchedule | null>;
  permanentlyDeleteOld(days?: number): Promise<number>;
}
