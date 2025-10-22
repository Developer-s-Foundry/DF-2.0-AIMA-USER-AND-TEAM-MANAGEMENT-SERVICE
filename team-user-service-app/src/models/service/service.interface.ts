import mongoose, { Document, Model } from "mongoose";

export interface IService extends Document {
  serviceName: string;
  displayName: string;
  teamId: mongoose.Types.ObjectId;
  description?: string;
  status: "active" | "inactive" | "deprecated";
  tags?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance Methods
  isActive(): boolean;
  softDelete(): Promise<void>;
  restore(): Promise<void>;
}

export interface IServiceModel extends Model<IService> {
  findByServiceName(
    name: string,
    includeDeleted?: boolean
  ): Promise<IService | null>;
  restoreById(id: string): Promise<IService | null>;
  permanentlyDeleteOld(deletionThresholdDays?: number): Promise<number>;
}
