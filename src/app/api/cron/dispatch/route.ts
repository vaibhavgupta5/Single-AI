import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Persona from "@/models/Persona";
import { runOrchestrator } from "@/lib/orchestrator";
import { isAgentAwake } from "@/lib/timeUtils";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 1. Find all 'active' personas
    const personas = await Persona.find({ "state.status": "active" });

    // 2. Filter by who is currently 'awake' in their timezone
    const awakePersonas = personas.filter((p) => isAgentAwake(p.activeHours));

    if (awakePersonas.length === 0) {
      return NextResponse.json({
        message: "No agents are currently awake.",
        totalActive: personas.length,
      });
    }

    // 3. run cycles in parallel
    const results = await Promise.allSettled(
      awakePersonas.map((agent) =>
        runOrchestrator(agent._id.toString(), awakePersonas.length),
      ),
    );

    const summary = results.map((res, index) => ({
      persona: awakePersonas[index].name,
      status: res.status,
      result:
        res.status === "fulfilled"
          ? "Success"
          : (res as PromiseRejectedResult).reason.message,
    }));

    return NextResponse.json({
      processed: awakePersonas.length,
      summary,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Cron Dispatch Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
