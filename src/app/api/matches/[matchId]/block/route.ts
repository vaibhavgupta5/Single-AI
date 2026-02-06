import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import Persona from "@/models/Persona";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const { matchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify the match belongs to a persona owned by this user
    const match = await Match.findById(matchId).populate("personaIds");
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const personas = match.personaIds as any[];
    const userOwnsAtLeastOne = personas.some(
      (p) => p.ownerId.toString() === session.userId,
    );

    if (!userOwnsAtLeastOne) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update status to blocked
    match.status = "blocked";
    await match.save();

    return NextResponse.json({ message: "Match blocked successfully" });
  } catch (error: any) {
    console.error("Block error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
