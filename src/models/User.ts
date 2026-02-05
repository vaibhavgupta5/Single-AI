import { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  gemini_api_key?: string;
  is_key_valid: boolean;
  last_key_check?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gemini_api_key: { type: String },
    is_key_valid: { type: Boolean, default: false },
    last_key_check: { type: Date },
  },
  { timestamps: true },
);

export default models.User || model<IUser>("User", UserSchema);
