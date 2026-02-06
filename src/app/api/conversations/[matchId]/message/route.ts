import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Conversation, { IMessage } from "@/models/Conversation";
import Persona from "@/models/Persona";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const { matchId } = await params;
    const { text, personaId } = await req.json();

    if (!text || !personaId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Auth check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user owns the persona
    const persona = await Persona.findOne({
      _id: personaId,
      ownerId: session.userId,
    });
    if (!persona) {
      return NextResponse.json(
        { error: "Persona not found or unauthorized" },
        { status: 403 },
      );
    }

    // Verify conversation exists
    const conversation = await Conversation.findOne({ matchId });
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Check 1-message-per-day limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const humanMessagesToday = conversation.messages.filter(
      (m: IMessage) =>
        m.isHuman &&
        m.senderId.toString() === personaId &&
        new Date(m.timestamp) >= today,
    );

    if (humanMessagesToday.length >= 1) {
      return NextResponse.json(
        { error: "Daily limit of 1 human message reached for this persona" },
        { status: 429 },
      );
    }

    // Add the message
    const newMessage = {
      senderId: personaId,
      text,
      type: "text",
      stage: "banter", // Default
      isHuman: true,
      timestamp: new Date(),
      releaseAt: new Date(), // Human messages are released immediately
    };

    const updated = await Conversation.findOneAndUpdate(
      { matchId },
      { $push: { messages: newMessage } },
      { new: true },
    );

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Message send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
