import mongoose from "mongoose";
import { IService, IServiceModel } from "./service.interface";
import { ServiceSchema } from "./service.schema";
import "./service.middleware";
import "./service.methods";

export const ServiceModel = mongoose.model<IService, IServiceModel>(
  "Service",
  ServiceSchema
);
