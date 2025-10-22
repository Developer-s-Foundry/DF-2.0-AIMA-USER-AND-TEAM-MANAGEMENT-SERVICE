import { Query } from "mongoose";
import {
  IEscalationPolicy,
  IEscalationPolicyModel,
} from "./escalationPolicy.interface";
import { EscalationPolicySchema } from "./escalationPolicy.schema";

// --- Ensure step order before saving ---
EscalationPolicySchema.pre<IEscalationPolicy>("save", function (next) {
  if (this.escalationSteps) {
    this.escalationSteps.sort((a, b) => a.order - b.order);
  }
  next();
});

// --- Validate unique step orders ---
EscalationPolicySchema.pre<IEscalationPolicy>("validate", function (next) {
  const orders = this.escalationSteps.map((s) => s.order);
  if (new Set(orders).size !== orders.length) {
    return next(new Error("Each escalation step must have a unique order."));
  }
  next();
});

// --- Exclude deleted policies by default ---
EscalationPolicySchema.pre<Query<any, IEscalationPolicy>>(
  /^find/,
  function (next) {
    const opts = (this as any).options || {};
    if (!opts.includeDeleted) this.where({ isDeleted: false });
    next();
  }
);

// --- Prevent updates to non-latest versions ---
EscalationPolicySchema.pre<Query<any, IEscalationPolicy>>(
  "findOneAndUpdate",
  async function (next) {
    const model = this.model as unknown as IEscalationPolicyModel;
    const doc = await model.findOne(this.getQuery());
    if (doc && !doc.isLatest) {
      return next(new Error("You cannot modify a non-latest policy version."));
    }
    next();
  }
);
