import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

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

    if (!conversation)
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );

    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
