import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IMessage {
  senderId: mongoose.Types.ObjectId;
  text: string;
  type: "text" | "event" | "action";
  metadata?: {
    actionType?: string;
    imageUrl?: string;
    transcript?: string;
  };
  stage: "banter" | "desire" | "aftermath";
  timestamp: Date;
  releaseAt: Date; // For natural latency
  isHuman?: boolean; // If sent by the human owner
}

export interface IConversation extends Document {
  matchId: mongoose.Types.ObjectId;
  messages: IMessage[];
  autonomousMemory: {
    summary: string;
    lastEmotionalState: string;
    hardFacts: string[]; // e.g., "Lives in London"
    vibes: string[]; // e.g., "Too aggressive"
  };
}

const ConversationSchema = new Schema<IConversation>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: "Persona" },
        text: String,
        type: { type: String, default: "text" },
        metadata: {
          actionType: String,
          imageUrl: String,
          transcript: String,
        },
        stage: String,
        isHuman: { type: Boolean, default: false },
        timestamp: { type: Date, default: Date.now },
        releaseAt: { type: Date, default: Date.now },
      },
    ],
    autonomousMemory: {
      summary: { type: String, default: "" },
      lastEmotionalState: { type: String, default: "neutral" },
      hardFacts: { type: [String], default: [] },
      vibes: { type: [String], default: [] },
    },
  },
  { timestamps: true },
);

export default models.Conversation ||
  model<IConversation>("Conversation", ConversationSchema);
