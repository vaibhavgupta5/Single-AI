import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Persona from "@/models/Persona";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const personas = await Persona.find({ ownerId: user._id });

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        hasApiKey: !!user.gemini_api_key,
        isKeyValid: user.is_key_valid,
      },
      personas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
