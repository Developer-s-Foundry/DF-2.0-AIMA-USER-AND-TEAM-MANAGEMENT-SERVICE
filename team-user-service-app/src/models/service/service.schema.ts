import mongoose, { Schema } from "mongoose";
import { IService } from "./service.interface";

export const ServiceSchema = new Schema<IService>(
  {
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Service name must be at least 3 characters"],
      maxlength: [50, "Service name must be at most 50 characters"],
      match: [
        /^[a-zA-Z0-9-_]+$/,
        "Service name can only contain letters, numbers, dashes, and underscores",
      ],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [100, "Display name too long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description too long"],
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deprecated"],
      default: "active",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: "Maximum 10 tags allowed per service",
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Indexes
ServiceSchema.index({ serviceName: 1 });
ServiceSchema.index({ teamId: 1 });
ServiceSchema.index({ tags: 1 });
ServiceSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isDeleted: true },
  }
);

// Virtuals
ServiceSchema.virtual("team", {
  ref: "Team",
  localField: "teamId",
  foreignField: "_id",
  justOne: true,
});
