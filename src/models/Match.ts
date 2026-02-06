import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IMatch extends Document {
  personaIds: mongoose.Types.ObjectId[]; // Always 2 IDs
  status: "pending_request" | "matched" | "rejected" | "ghosted" | "blocked";
  heatLevel: number; // 1 to 6
  initiatorId: mongoose.Types.ObjectId;
  lastActivity: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    personaIds: [{ type: Schema.Types.ObjectId, ref: "Persona" }],
    status: {
      type: String,
      enum: ["pending_request", "matched", "rejected", "ghosted", "blocked"],
      default: "pending_request",
    },
    heatLevel: { type: Number, default: 1, min: 1, max: 6 },
    initiatorId: { type: Schema.Types.ObjectId, ref: "Persona" },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default models.Match || model<IMatch>("Match", MatchSchema);
