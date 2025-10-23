import { Request, Response } from "express";
import mongoose from "mongoose";
import { requireModel } from "../models";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { validateObjectId } from "../utils/validateObjectId";
import {
  IOnCallSchedule,
  IOnCallScheduleModel,
} from "../models/onCallSchedule/onCallSchedule.interface";

// Dynamically load model (safe for tests or modular bootstrapping)
const OnCallScheduleModel = requireModel<IOnCallSchedule, IOnCallScheduleModel>(
  "OnCallSchedule"
);

/**
 * @desc    Create a new On-Call schedule
 * @route   POST /api/v1/on-call-schedules
 * @access  Protected
 */
export const createOnCallSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId, userId, priorityLevel, startTime, endTime } = req.body;

    // Validate required fields
    if (!teamId || !userId || !priorityLevel || !startTime || !endTime) {
      throw new AppError(
        "All fields (teamId, userId, priorityLevel, startTime, endTime) are required.",
        400
      );
    }

    if (!validateObjectId(teamId) || !validateObjectId(userId)) {
      throw new AppError("Invalid teamId or userId format", 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end)
      throw new AppError("startTime must be before endTime", 400);

    // Prevent overlapping schedules for the same team
    const overlap = await OnCallScheduleModel.findOne({
      teamId,
      $or: [
        { startTime: { $lte: end }, endTime: { $gte: start } }, // overlaps any part
      ],
    });

    if (overlap) {
      throw new AppError(
        "Overlapping on-call schedule exists for this team.",
        409
      );
    }

    const newSchedule = await OnCallScheduleModel.create({
      teamId,
      userId,
      priorityLevel,
      startTime: start,
      endTime: end,
    });

    res.status(201).json({
      success: true,
      message: "On-call schedule created successfully",
      data: newSchedule,
    });
  }
);

/**
 * @desc    Update an existing on-call schedule
 * @route   PATCH /api/v1/on-call-schedules/:id
 * @access  Protected
 */
export const updateOnCallSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      throw new AppError("Invalid schedule ID", 400);
    }

    // Convert date fields to Date objects if present
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);

    // Check for overlap only if start/end times are updated
    if (updates.startTime || updates.endTime) {
      const existing = await OnCallScheduleModel.findById(id);
      if (!existing) throw new AppError("On-call schedule not found", 404);

      const start = updates.startTime || existing.startTime;
      const end = updates.endTime || existing.endTime;

      const overlap = await OnCallScheduleModel.findOne({
        _id: { $ne: id },
        teamId: existing.teamId,
        $or: [{ startTime: { $lte: end }, endTime: { $gte: start } }],
      });

      if (overlap) {
        throw new AppError(
          "Update would cause overlapping schedule for this team.",
          409
        );
      }
    }

    const updated = await OnCallScheduleModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) throw new AppError("On-call schedule not found", 404);

    res.status(200).json({
      success: true,
      message: "On-call schedule updated successfully",
      data: updated,
    });
  }
);

/**
 * @desc    Get the current on-call person for a team
 * @route   GET /api/v1/on-call-schedules/current?teamId=<teamId>
 * @access  Public (or Protected later)
 */
export const getCurrentOnCall = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId } = req.query;

    if (!teamId) throw new AppError("teamId query parameter is required", 400);
    if (!validateObjectId(teamId as string))
      throw new AppError("Invalid teamId format", 400);

    const now = new Date();

    const onCall = await OnCallScheduleModel.findOne({
      teamId: new mongoose.Types.ObjectId(teamId as string),
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate({
        path: "userId",
        select: "fullName email slack_user_id pagerduty_contact_key",
      })
      .sort({ priorityLevel: 1 }) // lowest number = highest priority
      .lean();

    if (!onCall)
      throw new AppError("No one is currently on-call for this team.", 404);

    res.status(200).json({
      success: true,
      data: onCall,
    });
  }
);

/**
 * @desc    Soft delete an on-call schedule (if your schema supports soft deletes)
 * @route   DELETE /api/v1/on-call-schedules/:id
 * @access  Protected
 */
export const softDeleteOnCallSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!validateObjectId(id)) throw new AppError("Invalid schedule ID", 400);

    const schedule = await OnCallScheduleModel.findById(id);
    if (!schedule) throw new AppError("On-call schedule not found", 404);

    if (typeof (schedule as any).softDelete === "function") {
      await (schedule as any).softDelete();
    } else {
      await schedule.deleteOne();
    }

    res.status(200).json({
      success: true,
      message: "On-call schedule deleted successfully",
    });
  }
);
