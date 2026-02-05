import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET User Profile (Simulated via email header/query for now)
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST Create/Update User & Gemini Key
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, gemini_api_key } = body;

    if (!email || !gemini_api_key) {
      return NextResponse.json(
        { error: "Email and API Key are required" },
        { status: 400 },
      );
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        email,
        gemini_api_key,
        is_key_valid: true,
        last_key_check: new Date(),
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
