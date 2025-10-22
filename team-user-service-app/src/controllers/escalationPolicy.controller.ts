import { Request, Response } from "express";
import mongoose from "mongoose";
import { requireModel } from "../models";
import {
  IEscalationPolicy,
  IEscalationPolicyModel,
} from "../models/escalationPolicy/escalationPolicy.interface";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { validateObjectId } from "../utils/validateObjectId";

/**
 * Use requireModel() to guarantee that the model exists and is properly registered.
 */
const EscalationPolicyModel = requireModel<
  IEscalationPolicy,
  IEscalationPolicyModel
>("EscalationPolicy");

/**
 * @desc   Fetch escalation policy for a specific team (with optional version)
 * @route  GET /api/v1/escalation-policies?teamId=<teamId>[&version=<version>]
 * @access Public (can later restrict)
 */
export const getPolicyForTeam = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId, version } = req.query;

    if (!teamId || !validateObjectId(teamId as string)) {
      throw new AppError("A valid teamId query parameter is required", 400);
    }

    const filter: Record<string, any> = {
      teamId: new mongoose.Types.ObjectId(teamId as string),
    };

    if (version) {
      const parsedVersion = Number(version);
      if (isNaN(parsedVersion))
        throw new AppError("Version must be a number", 400);
      filter.version = parsedVersion;
    }

    const policy = await EscalationPolicyModel.findOne(filter)
      .populate("teamId", "name members")
      .lean();

    if (!policy)
      throw new AppError("No escalation policy found for this team.", 404);

    res.status(200).json({
      success: true,
      data: policy,
    });
  }
);

/**
 * @desc   Create or update an escalation policy (with conflict version handling)
 * @route  POST /api/v1/escalation-policies
 * @access Protected
 */
export const upsertPolicy = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId, policyName, escalationSteps, version } = req.body;

    if (!teamId || !policyName || !escalationSteps) {
      throw new AppError(
        "teamId, policyName, and escalationSteps are required",
        400
      );
    }

    if (!validateObjectId(teamId)) {
      throw new AppError("Invalid teamId format", 400);
    }

    const existing = await EscalationPolicyModel.findOne({ teamId });

    // Conflict prevention
    if (
      existing &&
      existing.version &&
      version &&
      version <= existing.version
    ) {
      throw new AppError(
        `Conflict: a newer version (${existing.version}) already exists.`,
        409
      );
    }

    const newVersion = version || (existing ? existing.version + 1 : 1);

    const updatedPolicy = await EscalationPolicyModel.findOneAndUpdate(
      { teamId },
      {
        $set: {
          teamId,
          policyName: policyName.trim(),
          escalationSteps,
          version: newVersion,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: existing
        ? "Policy updated successfully"
        : "Policy created successfully",
      data: updatedPolicy,
    });
  }
);

/**
 * @desc   Soft delete an escalation policy
 * @route  DELETE /api/v1/escalation-policies/:id
 * @access Protected
 */
export const softDeletePolicy = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      throw new AppError("Invalid policy ID", 400);
    }

    const policy = await EscalationPolicyModel.findById(id);
    if (!policy) throw new AppError("Policy not found", 404);

    await policy.softDelete();

    res.status(200).json({
      success: true,
      message: "Policy soft-deleted successfully",
    });
  }
);

/**
 * @desc   Restore a previously soft-deleted policy
 * @route  PATCH /api/v1/escalation-policies/:id/restore
 * @access Protected
 */
export const restorePolicy = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      throw new AppError("Invalid policy ID", 400);
    }

    const policy = await EscalationPolicyModel.restoreById(id);
    if (!policy) throw new AppError("Policy not found or already active", 404);

    res.status(200).json({
      success: true,
      message: "Policy restored successfully",
      data: policy,
    });
  }
);
