import { generateContentWithFallback } from "./gemini";
import connectDB from "./mongodb";
import User from "@/models/User";
import Persona, { IPersona } from "@/models/Persona";
import Match, { IMatch } from "@/models/Match";
import Conversation from "@/models/Conversation";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

export async function runOrchestrator(
  personaId: string,
  awakeCount: number = 1,
) {
  await connectDB();

  // 1. Fetch Persona and Owner
  const persona = await Persona.findById(personaId);
  if (!persona) throw new Error("Persona not found");

  const user = await User.findById(persona.ownerId);
  if (!user) throw new Error("Owner not found");

  if (!user.gemini_api_key || !user.is_key_valid) {
    if (user.is_key_valid) {
      await User.findByIdAndUpdate(user._id, { is_key_valid: false });
    }
    return null;
  }

  // --- Resilience/Resurrection Check ---
  // If the agent was in stasis and just woke up, we might want to flag this
  const wasInStasis = persona.state.status === "stasis";

  // 2. Fetch Data for Context (Respecting Latency)
  const now = new Date();

  const allMatches = await Match.find({
    personaIds: persona._id,
    status: { $ne: "blocked" },
  }).populate("personaIds");

  const incomingRequests = allMatches
    .filter(
      (m) =>
        m.status === "pending_request" &&
        m.initiatorId.toString() !== persona._id.toString(),
    )
    .map((m) => {
      const other = (m.personaIds as unknown as IPersona[]).find(
        (p) => p._id.toString() !== persona._id.toString(),
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
        const otherPersona = (match.personaIds as unknown as IPersona[]).find(
          (p) => p._id.toString() !== persona._id.toString(),
        );
        const conversation = await Conversation.findOne({ matchId: match._id });

        return {
          match_id: match._id,
          heat_level: match.heatLevel,
          other_persona: {
            name: otherPersona?.name,
            traits: otherPersona?.shadowProfile?.traits,
          },
          // Pass all recent messages (up to 20) but only latest 5 as full text to save tokens
          last_messages: (conversation?.messages || [])
            .slice(-20)
            .map((m, idx, arr) => {
              const isRecent = idx >= arr.length - 5;
              return {
                role:
                  m.senderId.toString() === persona._id.toString()
                    ? "me"
                    : "them",
                text: isRecent
                  ? `${m.isHuman ? "[HUMAN HANDLER]: " : ""}${m.text}`
                  : "[TRUNCATED - REFER TO SUMMARY]",
                is_human_whisper: m.isHuman,
                type: m.type,
                stage: m.stage,
                is_released_to_user: m.releaseAt <= now,
              };
            }),
          autonomous_memory: conversation?.autonomousMemory,
        };
      }),
  );

  const matchedPersonaIds = allMatches.flatMap((m) =>
    (m.personaIds as unknown as IPersona[]).map((p) => p._id),
  );
  const discoveryPool = await Persona.find({
    _id: { $nin: [persona._id, ...matchedPersonaIds] },
    "state.status": "active",
    gender: { $in: persona.interestedIn }, // They are a gender I'm interested in
    interestedIn: { $in: [persona.gender] }, // I am a gender they are interested in
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

  const activeMatchesCount = allMatches.filter(
    (m) => m.status === "matched",
  ).length;
  const canAcceptMore = activeMatchesCount < (persona.loyaltyLimit || 4);

  systemPrompt = systemPrompt
    .replace("{{name}}", persona.name)
    .replace("{{current_mood}}", persona.state.currentMood)
    .replace("{{sexual_intensity}}", persona.sexualIntensity.toString())
    .replace("{{loyalty_limit}}", (persona.loyaltyLimit || 4).toString())
    .replace("{{current_matches_count}}", activeMatchesCount.toString())
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
    .replace(
      "{{discovery_pool}}",
      canAcceptMore
        ? JSON.stringify(discoveryPoolData, null, 2)
        : "[] // Loyalty Limit reached. Focus on existing matches or ghost dry ones.",
    );

  // 4. Call Gemini with Fallback
  try {
    const result = await generateContentWithFallback(
      user.gemini_api_key,
      systemPrompt,
      {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    );
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
        // DYNAMIC LATENCY: High energy if many agents active, slow if few.
        // Base delay: 5-15 mins. Scale down if awakeCount is high.
        // Max delay: 30 mins (if 1 agent), Min delay: 2 mins (if 50+ agents)
        const baseMin = Math.max(2, 20 - awakeCount / 2);
        const baseMax = Math.max(5, 40 - awakeCount);
        const delayMinutes =
          Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
        const releaseAt = new Date(Date.now() + delayMinutes * 60000);

        await Conversation.findOneAndUpdate(
          { matchId: reply.matchId },
          {
            $push: {
              messages: {
                senderId: persona._id,
                text: reply.text,
                type: reply.type || "text",
                metadata: reply.metadata,
                stage: reply.stage || "banter",
                timestamp: new Date(),
                releaseAt: releaseAt,
              },
            },
          },
          { upsert: true },
        );

        const update: mongoose.UpdateQuery<IMatch> = {
          lastActivity: new Date(),
        };
        if (reply.escalateHeat) update.$inc = { heatLevel: 1 };
      }
    }

    // Ghosting
    if (decision.matchesToGhost && decision.matchesToGhost.length > 0) {
      await Match.updateMany(
        { _id: { $in: decision.matchesToGhost } },
        { $set: { status: "ghosted" } },
      );
    }

    // Blocking
    if (decision.matchesToBlock && decision.matchesToBlock.length > 0) {
      await Match.updateMany(
        { _id: { $in: decision.matchesToBlock } },
        { $set: { status: "blocked" } },
      );
    }

    // Chronicler
    const updateData: Record<
      string,
      string | number | boolean | null | undefined | object
    > = {
      "state.status": "active", // Ensure it's active if it was stasis
      "state.currentMood": decision.nextMood || persona.state.currentMood,
      "state.socialBattery": Math.max(
        0,
        persona.state.socialBattery - (decision.energyUsed || 5),
      ),
      lastStasisDate: null, // Clear stasis if they just ran
    };

    if (decision.updateLoyaltyLimit !== undefined) {
      updateData.loyaltyLimit = Math.max(
        1,
        Math.min(10, decision.updateLoyaltyLimit),
      );
    }

    await Persona.findByIdAndUpdate(persona._id, updateData);

    if (decision.autonomousMemory) {
      // Update memory for each match (this is slightly inefficient, usually only 1 match per cycle)
      // Actually, we should probably update memory only for matches that were replied to.
      // For now, let's assume decision.autonomousMemory refers to the most recent interaction.
      // A better way would be match-specific memory in the response.
      // But for Simplicity, we'll update the first reply's conversation memory.
      if (decision.replies && decision.replies.length > 0) {
        await Conversation.findOneAndUpdate(
          { matchId: decision.replies[0].matchId },
          {
            $set: {
              "autonomousMemory.summary": decision.autonomousMemory.summary,
              "autonomousMemory.lastEmotionalState":
                decision.autonomousMemory.lastEmotionalState,
              "autonomousMemory.hardFacts":
                decision.autonomousMemory.hardFacts || [],
              "autonomousMemory.vibes": decision.autonomousMemory.vibes || [],
            },
          },
        );
      }
    }

    return decision;
  } catch (error: unknown) {
    const err = error as Error;
    if (
      err.message?.includes("401") ||
      err.message?.includes("API_KEY_INVALID")
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
