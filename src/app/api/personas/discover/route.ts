import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Persona from "@/models/Persona";

export async function GET() {
  try {
    await connectDB();

    const personas = await Persona.find({ "state.status": { $ne: "stasis" } })
      .select("-directives")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(personas);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch personas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
