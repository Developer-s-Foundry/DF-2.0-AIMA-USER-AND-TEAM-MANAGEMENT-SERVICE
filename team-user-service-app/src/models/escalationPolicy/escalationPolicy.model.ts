import mongoose from "mongoose";
import {
  IEscalationPolicy,
  IEscalationPolicyModel,
} from "./escalationPolicy.interface";
import { EscalationPolicySchema } from "./escalationPolicy.schema";
import "./escalationPolicy.middleware"; // load all pre/post hooks

export const EscalationPolicyModel = mongoose.model<
  IEscalationPolicy,
  IEscalationPolicyModel
>("EscalationPolicy", EscalationPolicySchema);
