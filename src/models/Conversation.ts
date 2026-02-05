import mongoose, { Schema, Document, model, models } from "mongoose";

interface IMessage {
  senderId: mongoose.Types.ObjectId;
  text: string;
  stage: "banter" | "desire" | "aftermath";
  timestamp: Date;
  releaseAt: Date; // For natural latency
}

export interface IConversation extends Document {
  matchId: mongoose.Types.ObjectId;
  messages: IMessage[];
  autonomousMemory: {
    summary: string;
    lastEmotionalState: string;
  };
}

const ConversationSchema = new Schema<IConversation>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: "Persona" },
        text: String,
        stage: String,
        timestamp: { type: Date, default: Date.now },
        releaseAt: { type: Date, default: Date.now },
      },
    ],
    autonomousMemory: {
      summary: { type: String, default: "" },
      lastEmotionalState: { type: String, default: "neutral" },
    },
  },
  { timestamps: true },
);

export default models.Conversation ||
  model<IConversation>("Conversation", ConversationSchema);
