import { NextResponse } from "next/server";
import { generateContentWithFallback } from "@/lib/gemini";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { name, gender, sample, apiKey } = await req.json();

    const sampleText = sample || "";
    const geminiApiKey = apiKey || "";

    if (!sampleText || !geminiApiKey) {
      return NextResponse.json(
        { error: "Sample text and API Key are required" },
        { status: 400 },
      );
    }

    const promptPath = path.join(process.cwd(), "src/prompts/onboarding.txt");
    const systemPrompt = fs.readFileSync(promptPath, "utf8");

    const fullPrompt = `
${systemPrompt}

NAME: ${name}
GENDER: ${gender}
2 AM TEXT: "${sampleText}"
    `;

    const result = await generateContentWithFallback(geminiApiKey, fullPrompt);

    const dna = JSON.parse(result.response.text());

    return NextResponse.json(dna);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
