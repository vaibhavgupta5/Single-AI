import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const fullPrompt = `
${systemPrompt}

NAME: ${name}
GENDER: ${gender}
2 AM TEXT: "${sampleText}"
    `;

    const result = await model.generateContent(fullPrompt);
    const dna = JSON.parse(result.response.text());

    return NextResponse.json(dna);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
