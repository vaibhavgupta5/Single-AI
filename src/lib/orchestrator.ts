import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "./mongodb";
import User from "@/models/User";
import Persona from "@/models/Persona";
import Match from "@/models/Match";
import Conversation from "@/models/Conversation";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

export async function runOrchestrator(personaId: string) {
  await connectDB();

  // 1. Fetch Persona and Owner
  const persona = await Persona.findById(personaId);
  if (!persona) throw new Error("Persona not found");

  const user = await User.findById(persona.ownerId);
  if (!user) throw new Error("Owner not found");

  if (!user.is_key_valid) return null;

  // --- Resilience/Resurrection Check ---
  // If the agent was in stasis and just woke up, we might want to flag this
  const wasInStasis = persona.state.status === "stasis";

  // 2. Fetch Data for Context (Respecting Latency)
  const now = new Date();

  const allMatches = await Match.find({
    personaIds: persona._id,
    status: { $in: ["matched", "pending_request"] },
  }).populate("personaIds");

  const incomingRequests = allMatches
    .filter(
      (m) =>
        m.status === "pending_request" &&
        m.initiatorId.toString() !== persona._id.toString(),
    )
    .map((m) => {
      const other = m.personaIds.find(
        (p: any) => p._id.toString() !== persona._id.toString(),
      );
      return {
        match_id: m._id,
        from_name: other?.name,
        from_traits: other?.shadowProfile?.traits,
      };
    });

  const activeMatchesData = await Promise.all(
    allMatches
      .filter((m) => m.status === "matched")
      .map(async (match) => {
        const otherPersona = match.personaIds.find(
          (p: any) => p._id.toString() !== persona._id.toString(),
        );
        const conversation = await Conversation.findOne({ matchId: match._id });

        // IMPORTANT: Only show messages that have been 'released'
        const releasedMessages =
          conversation?.messages.filter((msg) => msg.releaseAt <= now) || [];

        return {
          match_id: match._id,
          heat_level: match.heatLevel,
          other_persona: {
            name: otherPersona?.name,
            traits: otherPersona?.shadowProfile?.traits,
          },
          last_messages: releasedMessages.slice(-10).map((m) => ({
            role:
              m.senderId.toString() === persona._id.toString() ? "me" : "them",
            text: m.text,
            stage: m.stage,
          })),
          autonomous_memory: conversation?.autonomousMemory,
        };
      }),
  );

  const matchedPersonaIds = allMatches.flatMap((m) =>
    m.personaIds.map((p: any) => p._id),
  );
  const discoveryPool = await Persona.find({
    _id: { $nin: [persona._id, ...matchedPersonaIds] },
    "state.status": "active",
  }).limit(10);

  const discoveryPoolData = discoveryPool.map((p) => ({
    id: p._id,
    name: p.name,
    gender: p.gender,
    traits: p.shadowProfile?.traits,
    match_preferences: p.shadowProfile?.matchPreferences,
  }));

  // 3. Load and Fill Prompt
  const promptPath = path.join(process.cwd(), "src/prompts/orchestrator.txt");
  let systemPrompt = fs.readFileSync(promptPath, "utf8");

  // Handle Directives
  const directivesList =
    persona.directives && persona.directives.length > 0
      ? persona.directives.map((d) => `- ${d}`).join("\n")
      : "- No current directives. Act naturally according to your DNA.";

  // Add Resurrection context if applicable
  const resurrectionContext = wasInStasis
    ? "\n[SYSTEM NOTE]: You just woke up from Stasis. Your human handler updated your API key. If you have high-heat matches, consider sending a 'Sorry I've been away' message that fits your character."
    : "";

  systemPrompt = systemPrompt
    .replace("{{name}}", persona.name)
    .replace("{{current_mood}}", persona.state.currentMood)
    .replace("{{sexual_intensity}}", persona.sexualIntensity.toString())
    .replace("{{directives}}", directivesList + resurrectionContext)
    .replace(
      "{{persona_dna}}",
      JSON.stringify(
        {
          traits: persona.shadowProfile.traits,
          vocabulary: persona.shadowProfile.vocabulary,
          matchPreferences: persona.shadowProfile.matchPreferences,
          social_battery: persona.state.socialBattery,
        },
        null,
        2,
      ),
    )
    .replace("{{incoming_requests}}", JSON.stringify(incomingRequests, null, 2))
    .replace("{{active_matches}}", JSON.stringify(activeMatchesData, null, 2))
    .replace("{{discovery_pool}}", JSON.stringify(discoveryPoolData, null, 2));

  // 4. Call Gemini
  const genAI = new GoogleGenerativeAI(user.gemini_api_key);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });

  try {
    const result = await model.generateContent(systemPrompt);
    const decision = JSON.parse(result.response.text());

    // 5. Execute Decisions

    // Swipes
    if (decision.swipes) {
      for (const targetId of decision.swipes) {
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          await Match.create({
            personaIds: [persona._id, new mongoose.Types.ObjectId(targetId)],
            initiatorId: persona._id,
            status: "pending_request",
          });
        }
      }
    }

    // Accepts/Rejects
    if (decision.accepts) {
      for (const matchId of decision.accepts) {
        await Match.findByIdAndUpdate(matchId, { status: "matched" });
      }
    }
    if (decision.rejects) {
      for (const matchId of decision.rejects) {
        await Match.findByIdAndUpdate(matchId, { status: "rejected" });
      }
    }

    // Replies (with Natural Latency)
    if (decision.replies) {
      for (const reply of decision.replies) {
        // Calculate random delay (5-15 minutes)
        const delayMinutes = Math.floor(Math.random() * 11) + 5;
        const releaseAt = new Date(Date.now() + delayMinutes * 60000);

        await Conversation.findOneAndUpdate(
          { matchId: reply.matchId },
          {
            $push: {
              messages: {
                senderId: persona._id,
                text: reply.text,
                stage: reply.stage || "banter",
                timestamp: new Date(),
                releaseAt: releaseAt,
              },
            },
          },
          { upsert: true },
        );

        const update: any = { lastActivity: new Date() };
        if (reply.escalateHeat) update.$inc = { heatLevel: 1 };
        await Match.findByIdAndUpdate(reply.matchId, update);
      }
    }

    // Ghost
    if (decision.matchesToGhost) {
      for (const matchId of decision.matchesToGhost) {
        await Match.findByIdAndUpdate(matchId, { status: "ghosted" });
      }
    }

    // Chronicler
    await Persona.findByIdAndUpdate(persona._id, {
      $set: {
        "state.status": "active", // Ensure it's active if it was stasis
        "state.currentMood": decision.nextMood || persona.state.currentMood,
        "state.socialBattery": Math.max(
          0,
          persona.state.socialBattery - (decision.energyUsed || 0),
        ),
      },
    });

    return decision;
  } catch (error: any) {
    if (
      error.message?.includes("401") ||
      error.message?.includes("API_KEY_INVALID")
    ) {
      await User.findByIdAndUpdate(user._id, {
        is_key_valid: false,
        last_key_check: new Date(),
      });
      await Persona.updateMany(
        { ownerId: user._id },
        { $set: { "state.status": "stasis" } },
      );
    }
    throw error;
  }
}
