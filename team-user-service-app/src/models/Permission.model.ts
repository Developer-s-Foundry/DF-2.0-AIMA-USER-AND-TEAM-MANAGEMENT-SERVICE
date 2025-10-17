import mongoose, {Schema, Document} from "mongoose";


export interface IPermission extends Document {
  _id: Schema.Types.ObjectId;
  permission_id: string;
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const PermissionSchema: Schema = new Schema(
  {
    permission_name: {
      type: String,
      required: true,
      unique:true,
      trim: true,
      lowercase: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim:true,
      lowercase:true,
    },
    description: {
      type:String,
      trim:true,
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    collection: 'permissions'
  }
);

PermissionSchema.index({permission_name: 1});
PermissionSchema.index({resource: 1, action: 1});

PermissionSchema.virtual('permission_id').get(function(this: IPermission) {
  return this._id.toString();
})

PermissionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret:any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);