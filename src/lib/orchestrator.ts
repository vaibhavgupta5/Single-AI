import { generateContentWithFallback } from "./gemini";
import connectDB from "./mongodb";
import User from "@/models/User";
import Persona, { IPersona } from "@/models/Persona";
import Match, { IMatch } from "@/models/Match";
import Conversation, { IMessage } from "@/models/Conversation";
import mongoose, { HydratedDocument } from "mongoose";
import fs from "fs";
import path from "path";

interface Decision {
  swipes?: string[];
  accepts?: string[];
  rejects?: string[];
  replies?: Array<{
    matchId: string;
    text: string;
    type?: "text" | "event" | "action";
    metadata?: {
      actionType?: string;
      imageUrl?: string;
      transcript?: string;
    };
    escalateHeat?: boolean;
    stage?: "banter" | "desire" | "aftermath";
  }>;
  matchesToGhost?: string[];
  matchesToBlock?: string[];
  autonomousMemory?: {
    summary: string;
    lastEmotionalState: string;
    hardFacts: string[];
    vibes: string[];
  };
  nextMood?: string;
  updateLoyaltyLimit?: number;
  energyUsed?: number;
}

type PopulatedMatch = HydratedDocument<
  Omit<IMatch, "personaIds"> & { personaIds: IPersona[] }
>;

export async function runOrchestrator(
  personaId: string,
  awakeCount: number = 1,
) {
  await connectDB();

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

  const wasInStasis = persona.state.status === "stasis";

  const now = new Date();

  const allMatches = (await Match.find({
    personaIds: persona._id,
    status: { $ne: "blocked" },
  }).populate<{ personaIds: IPersona[] }>("personaIds")) as PopulatedMatch[];

  const incomingRequests = allMatches
    .filter(
      (m) =>
        m.status === "pending_request" &&
        m.initiatorId.toString() !== persona._id.toString(),
    )
    .map((m) => {
      const other = m.personaIds.find(
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
        const otherPersona = match.personaIds.find(
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
          last_messages: (conversation?.messages ?? [])
            .slice(-20)
            .map((m: IMessage) => ({
              role:
                m.senderId.toString() === persona._id.toString()
                  ? "me"
                  : "them",
              text: `${m.isHuman ? "[HUMAN HANDLER]: " : ""}${m.text}`,
              is_human_whisper: m.isHuman,
              type: m.type,
              stage: m.stage,
              is_released_to_user: m.releaseAt <= now,
            })),
          autonomous_memory: conversation?.autonomousMemory,
        };
      }),
  );

  const matchedPersonaIds = allMatches.flatMap((m) =>
    m.personaIds.map((p) => p._id),
  );

  const discoveryPool = await Persona.find({
    _id: { $nin: [persona._id, ...matchedPersonaIds] },
    "state.status": "active",
    gender: { $in: persona.interestedIn },
    interestedIn: { $in: [persona.gender] },
  }).limit(10);

  const discoveryPoolData = discoveryPool.map((p) => ({
    id: p._id,
    name: p.name,
    gender: p.gender,
    traits: p.shadowProfile?.traits,
    match_preferences: p.shadowProfile?.matchPreferences,
  }));

  const promptPath = path.join(process.cwd(), "src/prompts/orchestrator.txt");
  let systemPrompt = fs.readFileSync(promptPath, "utf8");

  const directivesList =
    persona.directives && persona.directives.length > 0
      ? persona.directives.map((d: string | string[]) => `- ${d}`).join("\n")
      : "- No current directives. Act naturally according to your DNA.";

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

  try {
    const result = await generateContentWithFallback(
      user.gemini_api_key,
      systemPrompt,
      {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    );
    const decision: Decision = JSON.parse(result.response.text());

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

    if (decision.replies) {
      for (const reply of decision.replies) {
        const existingConv = await Conversation.findOne({
          matchId: reply.matchId,
        });
        const hasUnreleased = existingConv?.messages?.some(
          (m: IMessage) =>
            m.senderId.toString() === persona._id.toString() &&
            m.releaseAt > now,
        );
        if (hasUnreleased) continue;

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
                type: reply.type ?? "text",
                metadata: reply.metadata,
                stage: reply.stage ?? "banter",
                timestamp: new Date(),
                releaseAt: releaseAt,
              },
            },
          },
          { upsert: true },
        );

        const matchUpdate: mongoose.UpdateQuery<IMatch> = {
          lastActivity: new Date(),
        };
        if (reply.escalateHeat) {
          matchUpdate.$inc = { heatLevel: 1 };
        }
        await Match.findByIdAndUpdate(reply.matchId, matchUpdate);
      }
    }

    if (decision.matchesToGhost && decision.matchesToGhost.length > 0) {
      await Match.updateMany(
        { _id: { $in: decision.matchesToGhost } },
        { $set: { status: "ghosted" } },
      );
    }

    if (decision.matchesToBlock && decision.matchesToBlock.length > 0) {
      await Match.updateMany(
        { _id: { $in: decision.matchesToBlock } },
        { $set: { status: "blocked" } },
      );
    }

    const updateData: mongoose.UpdateQuery<IPersona> = {
      "state.status": "active",
      "state.currentMood": decision.nextMood ?? persona.state.currentMood,
      "state.socialBattery": Math.max(
        0,
        persona.state.socialBattery - (decision.energyUsed ?? 5),
      ),
      lastStasisDate: null,
    };

    if (decision.updateLoyaltyLimit !== undefined) {
      updateData.loyaltyLimit = Math.max(
        1,
        Math.min(10, decision.updateLoyaltyLimit),
      );
    }

    await Persona.findByIdAndUpdate(persona._id, updateData);

    if (
      decision.autonomousMemory &&
      decision.replies &&
      decision.replies.length > 0
    ) {
      await Conversation.findOneAndUpdate(
        { matchId: decision.replies[0].matchId },
        {
          $set: {
            "autonomousMemory.summary": decision.autonomousMemory.summary,
            "autonomousMemory.lastEmotionalState":
              decision.autonomousMemory.lastEmotionalState,
            "autonomousMemory.hardFacts":
              decision.autonomousMemory.hardFacts ?? [],
            "autonomousMemory.vibes": decision.autonomousMemory.vibes ?? [],
          },
        },
      );
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
