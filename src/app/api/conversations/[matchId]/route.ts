import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Match from "@/models/Match";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    await connectDB();
    const { matchId } = await params;

    const conversation = await Conversation.findOne({
      matchId: matchId,
    }).populate({
      path: "matchId",
      populate: { path: "personaIds" },
    });

    if (!conversation) {
      // If no conversation doc yet, check if the match itself exists
      const match = await Match.findById(matchId).populate("personaIds");
      if (!match) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }

      // Return a "virtual" conversation object for empty matches
      return NextResponse.json({
        matchId: match,
        messages: [],
        autonomousMemory: {},
      });
    }

    return NextResponse.json(conversation);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
