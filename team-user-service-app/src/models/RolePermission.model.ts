import mongoose, {Schema, Document, SchemaType} from "mongoose";
import { Permission } from "./Permission.model";

export enum RoleType {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export interface IRolePermission extends Document {
  role: RoleType;
  permission_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}


const RolePermissionSchema: Schema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: Object.values(RoleType),
      lowercase: true,
      trim: true,
    },
    permission_id: {
      type: Schema.Types.ObjectId,
      ref: 'Permission',
      required: true,
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    collection: 'role_permissions'
  }
);

RolePermissionSchema.index({role:1, permission_id: 1}, {unique:true});
RolePermissionSchema.index({role:1});
RolePermissionSchema.index({permission_id: 1});

RolePermissionSchema.set('toJSON', {
  virtuals:true,
  transform: function(doc, ret:any){
    delete ret._id;
    delete ret.__v;
    return ret;
  }
})

interface IRolePermissionModel extends mongoose.Model<IRolePermission> {
  getPermissionsForRole(role: RoleType): Promise<IRolePermission[]>;
  hasPermission(role: RoleType, permissionName: string): Promise<boolean>;
}


RolePermissionSchema.statics.getPermissionsForRole = async function(role:RoleType) {
  return this.find({role}).populate('permission_id');
}

RolePermissionSchema.statics.hasPermission = async function(
  role: RoleType, 
  permissionName: string
): Promise<boolean> {
  const permission = await Permission.findOne({ permission_name: permissionName });
  if (!permission) return false;
  
  const rolePermission = await this.findOne({
    role,
    permission_id: permission._id
  });
  
  return !!rolePermission;
};


export const RolePermission = mongoose.model<IRolePermission, IRolePermissionModel>(
  'RolePermission', 
  RolePermissionSchema
);