import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Persona from "@/models/Persona";
import { runOrchestrator } from "@/lib/orchestrator";

export async function POST(req: Request) {
  try {
    await connectDB();

    // In a real scenario, you might want to filter only personas
    // whose current time is within their 'activeHours'.
    // For this implementation, we run for all 'active' personas.

    const activePersonas = await Persona.find({ "state.status": "active" });

    const results = [];
    for (const persona of activePersonas) {
      try {
        const decision = await runOrchestrator(persona._id.toString());
        results.push({ personaId: persona._id, status: "success", decision });
      } catch (err: any) {
        results.push({
          personaId: persona._id,
          status: "error",
          error: err.message,
        });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
