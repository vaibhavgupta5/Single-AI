import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Persona from "@/models/Persona";

// GET all personas for an owner
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId)
      return NextResponse.json({ error: "ownerId required" }, { status: 400 });

    const personas = await Persona.find({ ownerId });
    return NextResponse.json(personas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST Create a new Persona
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const persona = await Persona.create(body);
    return NextResponse.json(persona, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
