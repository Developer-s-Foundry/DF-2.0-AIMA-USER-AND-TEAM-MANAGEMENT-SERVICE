import mongoose, { Schema } from "mongoose";
import { IOnCallSchedule } from "./onCallSchedule.interface";

export const OnCallScheduleSchema = new Schema<IOnCallSchedule>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    priorityLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IOnCallSchedule, v: Date) {
          return v > this.startTime;
        },
        message: "End time must be after start time",
      },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TTL cleanup for soft-deleted docs
OnCallScheduleSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isDeleted: true },
  }
);
