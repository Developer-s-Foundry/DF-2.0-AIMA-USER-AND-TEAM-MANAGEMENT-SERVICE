import mongoose, { Query } from "mongoose";
import { IService } from "./service.interface";
import { ServiceSchema } from "./service.schema";

// Normalize before save
ServiceSchema.pre<IService>("save", function (next) {
  if (this.serviceName)
    this.serviceName = this.serviceName.trim().toLowerCase();
  if (this.displayName) this.displayName = this.displayName.trim();
  next();
});

// Auto-exclude deleted documents unless explicitly included
function autoExcludeDeleted(
  this: Query<any, IService>,
  next: () => void
): void {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
}

ServiceSchema.pre<Query<any, IService>>(/^find/, autoExcludeDeleted);
ServiceSchema.pre<Query<any, IService>>(/^findOne/, autoExcludeDeleted);
ServiceSchema.pre<Query<any, IService>>(/^count/, autoExcludeDeleted);
ServiceSchema.pre<Query<any, IService>>(/^countDocuments/, autoExcludeDeleted);

export { ServiceSchema };
