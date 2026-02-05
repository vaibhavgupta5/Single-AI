import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Persona from "@/models/Persona";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const persona = await Persona.findById(id);
    if (!persona)
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    return NextResponse.json(persona);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const persona = await Persona.findByIdAndUpdate(id, body, {
      new: true,
    });
    return NextResponse.json(persona);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    await Persona.findByIdAndDelete(id);
    return NextResponse.json({ message: "Persona deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
