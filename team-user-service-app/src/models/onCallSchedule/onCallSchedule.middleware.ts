import mongoose, { Query } from "mongoose";
import { IOnCallSchedule } from "./onCallSchedule.interface";
import { OnCallScheduleSchema } from "./onCallSchedule.schema";

// --- Exclude soft-deleted docs ---
const excludeDeleted = function (
  this: Query<any, IOnCallSchedule>,
  next: () => void
) {
  if (!(this as any).getOptions()?.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
};

OnCallScheduleSchema.pre(/^find/, excludeDeleted);
OnCallScheduleSchema.pre(/^findOne/, excludeDeleted);
OnCallScheduleSchema.pre(/^count/, excludeDeleted);

// --- Conflict prevention & auto-resolution ---
OnCallScheduleSchema.pre("save", async function (next) {
  const doc = this as IOnCallSchedule & { $locals?: Record<string, any> };

  if (doc.isDeleted || doc.$locals?.skipConflictCheck) return next();

  const graceMinutes = doc.$locals?.gracePeriodMinutes ?? 5;
  const graceMs = graceMinutes * 60 * 1000;
  const adjustedStart = new Date(doc.startTime.getTime() - graceMs);
  const adjustedEnd = new Date(doc.endTime.getTime() + graceMs);

  const conflicts = await mongoose.models.OnCallSchedule.find({
    _id: { $ne: doc._id },
    teamId: doc.teamId,
    priorityLevel: doc.priorityLevel,
    isDeleted: false,
    startTime: { $lt: adjustedEnd },
    endTime: { $gt: adjustedStart },
  });

  if (conflicts.length === 0) return next();

  for (const conflict of conflicts) {
    const overlapStart = new Date(
      Math.max(conflict.startTime.getTime(), doc.startTime.getTime())
    );
    const overlapEnd = new Date(
      Math.min(conflict.endTime.getTime(), doc.endTime.getTime())
    );
    const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();

    if (Math.abs(overlapDuration) <= graceMs) continue;

    console.warn(
      `[Auto-Resolve] Overlap between ${conflict._id} and new schedule (team=${doc.teamId})`
    );

    // Resolution rules
    if (conflict.endTime > doc.startTime && conflict.endTime < doc.endTime) {
      conflict.endTime = new Date(doc.startTime.getTime() - 1);
      await conflict.save();
    } else if (
      doc.startTime < conflict.endTime &&
      doc.startTime > conflict.startTime
    ) {
      doc.startTime = new Date(conflict.endTime.getTime() + 1);
    } else if (conflict.startTime < doc.startTime) {
      conflict.isDeleted = true;
      conflict.deletedAt = new Date();
      await conflict.save();
    } else {
      doc.startTime = new Date(conflict.endTime.getTime() + 1);
    }
  }

  next();
});
