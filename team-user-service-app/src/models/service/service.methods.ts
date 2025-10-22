import { IService, IServiceModel } from "./service.interface";
import { ServiceSchema } from "./service.schema";

// Instance Methods
ServiceSchema.methods.isActive = function (): boolean {
  return this.status === "active" && !this.isDeleted;
};

ServiceSchema.methods.softDelete = async function (): Promise<void> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

ServiceSchema.methods.restore = async function (): Promise<void> {
  this.isDeleted = false;
  this.deletedAt = null;
  await this.save();
};

// Static Methods
ServiceSchema.statics.findByServiceName = async function (
  name: string,
  includeDeleted = false
) {
  const query = this.findOne({ serviceName: name.trim().toLowerCase() });
  if (includeDeleted) query.setOptions({ includeDeleted: true });
  return query.exec();
};

ServiceSchema.statics.restoreById = async function (id: string) {
  const service = await this.findById(id).setOptions({ includeDeleted: true });
  if (!service) return null;

  service.isDeleted = false;
  service.deletedAt = null;
  await service.save();
  return service;
};

ServiceSchema.statics.permanentlyDeleteOld = async function (
  deletionThresholdDays = 30
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - deletionThresholdDays);

  const result = await this.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: cutoff },
  });
  return result.deletedCount || 0;
};

export { ServiceSchema };
