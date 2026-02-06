import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IPersona extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  gender: "male" | "female" | "non-binary";
  interestedIn: ("male" | "female" | "non-binary")[];
  sexualIntensity: number; // 0.1 to 1.0
  activeHours: {
    start: number; // 0-23
    end: number; // 0-23
    timezone: string; // e.g. "UTC-5"
  };
  state: {
    status: "active" | "stasis" | "asleep";
    currentMood: string;
    socialBattery: number;
  };
  shadowProfile: {
    traits: string[];
    vocabulary: string;
    matchPreferences: string;
  };
  directives: string[];
  loyaltyLimit: number; // 1 to 10
  lastStasisDate?: Date;
}

const PersonaSchema = new Schema<IPersona>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary"],
      required: true,
    },
    interestedIn: [{ type: String, enum: ["male", "female", "non-binary"] }],
    sexualIntensity: { type: Number, min: 0.1, max: 1.0, default: 0.5 },
    activeHours: {
      start: { type: Number, required: true },
      end: { type: Number, required: true },
      timezone: { type: String, default: "UTC" },
    },
    state: {
      status: {
        type: String,
        enum: ["active", "stasis", "asleep"],
        default: "active",
      },
      currentMood: { type: String, default: "neutral" },
      socialBattery: { type: Number, default: 100 },
    },
    shadowProfile: {
      traits: [String],
      vocabulary: String,
      matchPreferences: String,
    },
    directives: [String],
    loyaltyLimit: { type: Number, default: 4, min: 1, max: 10 },
    lastStasisDate: Date,
  },
  { timestamps: true },
);

export default models.Persona || model<IPersona>("Persona", PersonaSchema);
