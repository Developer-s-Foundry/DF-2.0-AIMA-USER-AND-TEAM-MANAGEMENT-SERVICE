import { Request, Response } from "express";
import mongoose from "mongoose";
import { requireModel } from "../models"; // ← Uses your dynamic model loader
import { IService } from "../models/service"; // for type hinting

// Dynamically load the model
const ServiceModel = requireModel<IService>("Service");

/* ----------------------------- Utility Helper ----------------------------- */
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(`[ServiceController] ${message}:`, error);
  return res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  });
};

/* ----------------------------- Controller Logic ---------------------------- */

// Get all services
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await ServiceModel.find().populate("teamId", "teamName");
    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    return handleError(res, error, "Error fetching services");
  }
};

// Get team for a specific service
export const getTeamForService = async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.params;

    if (!serviceName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    const service = await ServiceModel.findOne({ serviceName }).populate(
      "teamId",
      "teamName"
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service '${serviceName}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        serviceName: service.serviceName,
        team: service.teamId,
      },
    });
  } catch (error) {
    return handleError(res, error, "Error fetching service team");
  }
};

// Create a new service
export const createService = async (req: Request, res: Response) => {
  try {
    const { serviceName, displayName, teamId } = req.body;

    // Basic validation
    if (!serviceName || !displayName || !teamId) {
      return res.status(400).json({
        success: false,
        message: "serviceName, displayName, and teamId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teamId format",
      });
    }

    // Check for existing service
    const existing = await ServiceModel.findOne({ serviceName });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Service '${serviceName}' already exists`,
      });
    }

    // Create and save
    const newService = new ServiceModel({ serviceName, displayName, teamId });
    const savedService = await newService.save();

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: savedService,
    });
  } catch (error) {
    return handleError(res, error, "Error creating service");
  }
};

// Update an existing service
export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
    }

    const updatedService = await ServiceModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    return handleError(res, error, "Error updating service");
  }
};
