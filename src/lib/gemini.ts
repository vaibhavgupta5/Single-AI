import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash",
  "gemma-3-12b",
];

export async function generateContentWithFallback(
  apiKey: string,
  prompt: string,
  config: GenerationConfig = { responseMimeType: "application/json" },
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: config,
      });

      const result = await model.generateContent(prompt);
      return result;
    } catch (error: any) {
      console.error(`Error with model ${modelName}:`, error.message);
      lastError = error;

      // If it's a 401 (Invalid API Key), we shouldn't retry with other models
      if (
        error.message?.includes("401") ||
        error.message?.includes("API_KEY_INVALID")
      ) {
        throw error;
      }

      // Continue to next model for other errors (like rate limit, 500, etc.)
      continue;
    }
  }

  throw lastError || new Error("All models failed");
}
