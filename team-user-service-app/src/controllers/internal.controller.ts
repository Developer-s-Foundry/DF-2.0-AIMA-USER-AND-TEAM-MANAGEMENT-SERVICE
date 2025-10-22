import { Request, Response } from "express";
import mongoose from "mongoose";
import { requireModel } from "../models";
import { IService } from "../models/service";
import { IOnCallSchedule } from "../models/onCallSchedule";
import { IEscalationPolicy } from "../models/escalationPolicy";

// Dynamically load models via the model registry
const ServiceModel = requireModel<IService>("Service");
const OnCallScheduleModel = requireModel<IOnCallSchedule>("OnCallSchedule");
const EscalationPolicyModel =
  requireModel<IEscalationPolicy>("EscalationPolicy");

/* -------------------------------------------------------------------------- */
/*                           Utility / Helper Methods                         */
/* -------------------------------------------------------------------------- */

const handleError = (res: Response, error: unknown, message: string) => {
  console.error(`[InternalController] ${message}:`, error);
  return res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  });
};

/**
 * @desc Internal endpoint for Incident Service to fetch responsibility chain
 * @route GET /internal/api/v1/responsibility?service=<serviceName>
 * @access Internal (requires secret header)
 */
export const getResponsibilityForService = async (
  req: Request,
  res: Response
) => {
  try {
    /* ---------------------------- 1. Validate Input --------------------------- */
    const { service: serviceName } = req.query;

    if (
      !serviceName ||
      typeof serviceName !== "string" ||
      !serviceName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid 'service' query parameter is required.",
      });
    }

    /* ---------------------------- 2. Validate Secret -------------------------- */
    const secretHeader = req.headers["x-internal-secret"];
    const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

    if (!secretHeader || secretHeader !== INTERNAL_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid internal secret.",
      });
    }

    /* ------------------------- 3. Fetch the Service Info ----------------------- */
    const service = await ServiceModel.findOne({ serviceName })
      .populate("teamId", "teamName")
      .lean();

    if (!service || !service.teamId) {
      return res.status(404).json({
        success: false,
        message: `No team found responsible for service: ${serviceName}`,
      });
    }

    const teamId = (service.teamId as any)._id;

    /* --------------------- 4. Fetch Current On-Call Person --------------------- */
    const now = new Date();
    const onCallSchedule = await OnCallScheduleModel.findOne({
      teamId,
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate({
        path: "userId",
        select: "fullName email slack_user_id pagerduty_contact_key",
      })
      .sort({ priorityLevel: 1 })
      .lean();

    /* -------------------- 5. Fetch Escalation Policy Chain -------------------- */
    const escalationPolicy = await EscalationPolicyModel.findOne({
      teamId,
      isLatest: true, // Always fetch latest version
      isDeleted: { $ne: true },
    })
      .lean()
      .exec();

    const escalationChain: any[] = [];

    /* ---------------- Add Primary On-Call as Step 0 if Available --------------- */
    if (onCallSchedule?.userId) {
      escalationChain.push({
        order: 0,
        type: "user",
        timeoutMinutes:
          escalationPolicy?.escalationSteps?.[0]?.timeoutMinutes || 15,
        target: onCallSchedule.userId,
      });
    }

    /* --------------------- Populate Escalation Targets ------------------------ */
    if (escalationPolicy?.escalationSteps?.length) {
      for (const step of escalationPolicy.escalationSteps) {
        if (!step.escalationTargetId) continue;

        const modelName = step.escalationType === "user" ? "User" : "Team";
        const TargetModel = requireModel(modelName);

        const target = await TargetModel.findById(step.escalationTargetId)
          .select(
            step.escalationType === "user" ? "fullName email" : "teamName"
          )
          .lean();

        escalationChain.push({
          order: step.order,
          type: step.escalationType,
          timeoutMinutes: step.timeoutMinutes,
          target: target || { _id: step.escalationTargetId, missing: true },
        });
      }
    }

    /* -------------------------- 6. Build Response ----------------------------- */
    const response = {
      success: true,
      serviceName: service.serviceName,
      responsibleTeam: service.teamId,
      onCallPrimary: onCallSchedule?.userId || null,
      escalationChain,
    };

    return res.status(200).json(response);
  } catch (error) {
    return handleError(
      res,
      error,
      "Server error while resolving responsibility"
    );
  }
};
