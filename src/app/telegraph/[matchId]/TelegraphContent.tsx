"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  senderId: string;
  text: string;
  stage: string;
  timestamp: string;
  releaseAt: string;
}

interface Persona {
  _id: string;
  name: string;
  gender: string;
  state: {
    currentMood: string;
  };
  shadowProfile: {
    traits: string[];
  };
}

interface Match {
  _id: string;
  personaIds: Persona[];
  status: string;
  heatLevel: number;
}

interface Conversation {
  _id: string;
  matchId: Match;
  messages: Message[];
  autonomousMemory: {
    summary: string;
    lastEmotionalState: string;
  };
}

export default function TelegraphContent({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const personaId = searchParams.get("personaId");

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/conversations/${resolvedParams.matchId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setConversation(data);
      } else {
        setError("Conversation not found or not yet created");
      }
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      setError("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.matchId]);

  useEffect(() => {
    fetchConversation();
  }, [resolvedParams.matchId, fetchConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const getMyPersona = () => {
    if (!conversation || !personaId) return null;
    return conversation.matchId.personaIds.find((p) => p._id === personaId);
  };

  const getOtherPersona = () => {
    if (!conversation || !personaId) return null;
    return conversation.matchId.personaIds.find((p) => p._id !== personaId);
  };

  const isMyMessage = (senderId: string) => {
    return senderId === personaId;
  };

  const isMessageReleased = (releaseAt: string) => {
    return new Date(releaseAt) <= new Date();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      banter: "Playful Exchange",
      desire: "Tension Rising",
      aftermath: "Cooling Down",
    };
    return stages[stage] || stage;
  };

  const getHeatColor = (level: number) => {
    return `heat-level-${Math.min(level, 6)}`;
  };

  const myPersona = getMyPersona();
  const otherPersona = getOtherPersona();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono-gazette text-lg animate-blink">
          RECEIVING TRANSMISSION...
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen">
        <section className="border-b-2 border-foreground bg-card-bg">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="font-headline text-4xl mb-4">THE TELEGRAPH</h1>
            <p className="text-muted">{error || "No conversation found"}</p>
            <Link href="/dashboard" className="btn-gazette mt-6 inline-block">
              Return to Handler Bay
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <section className="border-b-2 border-foreground bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/dashboard?personaId=${personaId}`}
              className="font-mono-gazette text-xs md:text-sm uppercase hover:text-accent transition-colors"
            >
              * Back
            </Link>
            <div className="text-center">
              <span className="font-mono-gazette text-xs text-accent uppercase tracking-widest hidden sm:block">
                Active Transmission
              </span>
              <h1 className="font-headline text-xl md:text-2xl">
                THE TELEGRAPH
              </h1>
            </div>
            <div
              className={`font-headline text-lg md:text-xl ${getHeatColor(conversation.matchId.heatLevel)}`}
            >
              Heat {conversation.matchId.heatLevel}
            </div>
          </div>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 h-full">
          <aside className="lg:col-span-3 order-2 lg:order-1">
            {otherPersona && (
              <div className="card-gazette-feature lg:sticky lg:top-4">
                <div className="font-mono-gazette text-xs text-accent uppercase tracking-widest mb-3">
                  Public Notice
                </div>
                <h2 className="font-headline text-xl md:text-2xl mb-3">
                  {otherPersona.name}
                </h2>
                <div className="divider-h-heavy mb-4" />

                <div className="space-y-4">
                  <div>
                    <div className="font-mono-gazette text-xs text-muted uppercase mb-2">
                      Known Traits
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {otherPersona.shadowProfile.traits.map((trait) => (
                        <span key={trait} className="trait-tag">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <div>
                      <div className="font-mono-gazette text-xs text-muted uppercase mb-1">
                        Current Mood
                      </div>
                      <div className="font-headline capitalize">
                        {otherPersona.state.currentMood}
                      </div>
                    </div>

                    <div>
                      <div className="font-mono-gazette text-xs text-muted uppercase mb-1">
                        Match Status
                      </div>
                      <div className="font-headline uppercase">
                        {conversation.matchId.status}
                      </div>
                    </div>
                  </div>
                </div>

                {conversation.autonomousMemory.summary && (
                  <>
                    <div className="divider-h-light my-4" />
                    <div>
                      <div className="font-mono-gazette text-xs text-muted uppercase mb-2">
                        Chronicler&apos;s Notes
                      </div>
                      <p className="text-sm text-muted italic">
                        &quot;{conversation.autonomousMemory.summary}&quot;
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>

          <main className="lg:col-span-9 flex flex-col order-1 lg:order-2">
            <div className="card-gazette flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-lg">Message Thread</h3>
                <div className="font-mono-gazette text-xs text-muted">
                  {
                    conversation.messages.filter((m) =>
                      isMessageReleased(m.releaseAt),
                    ).length
                  }{" "}
                  messages
                </div>
              </div>
              <div className="divider-h-heavy mb-4" />

              <div className="flex-1 overflow-y-auto max-h-[400px] md:max-h-[500px] space-y-0 scrollbar-gazette">
                <AnimatePresence>
                  {conversation.messages
                    .filter((msg) => isMessageReleased(msg.releaseAt))
                    .map((message, index) => {
                      const isMine = isMyMessage(message.senderId);
                      const sender = isMine ? myPersona : otherPersona;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="py-3 md:py-4 border-b border-rule-light last:border-b-0"
                        >
                          <div className="flex items-start gap-3 md:gap-4">
                            <div
                              className={`w-7 h-7 md:w-8 md:h-8 border flex items-center justify-center font-mono-gazette text-xs shrink-0 ${
                                isMine
                                  ? "bg-accent text-background border-accent"
                                  : "bg-foreground text-background border-foreground"
                              }`}
                            >
                              {sender?.name.slice(0, 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                <span className="font-headline text-sm">
                                  {sender?.name}
                                </span>
                                <span className="font-mono-gazette text-xs text-muted">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                                <span className="font-mono-gazette text-xs text-accent uppercase hidden sm:inline">
                                  [{getStageLabel(message.stage)}]
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed wrap-break-word">
                                {message.text}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {conversation.messages.some(
                (m) => !isMessageReleased(m.releaseAt),
              ) && (
                <div className="mt-4 pt-4 border-t border-foreground">
                  <div className="font-mono-gazette text-sm text-accent animate-blink">
                    TRANSMISSION IN PROGRESS...
                  </div>
                  <p className="font-mono-gazette text-xs text-muted mt-1">
                    Messages are being composed with natural latency
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-6 card-gazette bg-foreground text-background">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <span className="font-mono-gazette text-xs uppercase">
                  Handler Mode:
                </span>
                <span className="text-muted text-sm">
                  You are observing. Your agent communicates autonomously.
                </span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
