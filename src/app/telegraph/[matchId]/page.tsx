"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../components/AuthProvider";
import { HeatMeter, PulsingDot } from "../../components/AnimatedUI";

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

export default function TelegraphPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const personaId = searchParams.get("personaId");

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${resolvedParams.matchId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
      } else {
        setError("Conversation not found");
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
      setError("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.matchId]);

  useEffect(() => {
    if (user) {
      fetchConversation();
    }
  }, [resolvedParams.matchId, user, fetchConversation]);

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

  const isMyMessage = (senderId: string) => senderId === personaId;

  const isMessageReleased = (releaseAt: string) =>
    new Date(releaseAt) <= new Date();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const myPersona = getMyPersona();
  const otherPersona = getOtherPersona();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent animate-pulse" />
          <span className="text-text-muted">Decoding Telegraph...</span>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass border border-dashed border-accent/40 p-12 text-center max-w-lg w-full">
          <div className="w-16 h-16 mx-auto mb-6 border border-dashed border-accent/40 flex items-center justify-center text-accent">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="font-display text-2xl mb-2">Protocol Error</h3>
          <p className="text-text-secondary mb-8 leading-relaxed">
            {error ||
              "Transmission data corrupted. The requested conversation protocol is unreachable."}
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <section className="border-b border-dashed border-border/60 bg-bg-secondary/30 sticky top-[72px] z-40 glass">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard`}
              className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-text-muted hover:text-accent transition-colors group"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Command</span>
            </Link>

            <div className="text-center absolute left-1/2 -translate-x-1/2 hidden md:block">
              <div className="text-[9px] text-accent uppercase tracking-[0.3em] mb-1">
                Active Telegraph Stream
              </div>
              <h1 className="font-display text-xl tracking-tight">
                {myPersona?.name}{" "}
                <span className="text-text-muted opacity-40 mx-2">&bull;</span>{" "}
                {otherPersona?.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1.5 hidden sm:block">
                  Affinity Level
                </div>
                <div className="flex items-center gap-3 justify-end text-accent">
                  <span className="font-display text-lg">
                    0{conversation.matchId.heatLevel}
                  </span>
                  <div className="w-px h-8 bg-border/40" />
                  <HeatMeter level={conversation.matchId.heatLevel} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 order-2 lg:order-1 space-y-8">
            {otherPersona && (
              <div className="lg:sticky lg:top-[160px] space-y-8">
                <div className="card-aura p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-2xl mb-1">
                        {otherPersona.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <PulsingDot color="success" size={6} />
                        <span className="text-[10px] uppercase tracking-widest text-text-muted">
                          {conversation.matchId.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-[9px] text-text-muted uppercase tracking-widest mb-3">
                        Detected Traits
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {otherPersona.shadowProfile.traits
                          .slice(0, 4)
                          .map((trait) => (
                            <span
                              key={trait}
                              className="px-2 py-0.5 text-[9px] border border-dashed border-accent/30 text-accent/80 bg-accent/2"
                            >
                              {trait}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-border/40 pt-4">
                      <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">
                        Current Mood
                      </div>
                      <div className="capitalize text-text-primary font-display">
                        {otherPersona.state.currentMood}
                      </div>
                    </div>
                  </div>
                </div>

                {conversation.autonomousMemory.summary && (
                  <div className="glass border border-dashed border-border/60 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rotate-45 translate-x-10 -translate-y-10 border-l border-dashed border-accent/20" />
                    <h3 className="text-[9px] text-text-muted uppercase tracking-[0.2em] mb-4">
                      Autonomous Memory
                    </h3>
                    <p className="text-text-secondary text-xs italic leading-relaxed border-l-2 border-accent/40 pl-4">
                      &ldquo;{conversation.autonomousMemory.summary}&rdquo;
                    </p>
                    {conversation.autonomousMemory.lastEmotionalState && (
                      <div className="mt-4 pt-4 border-t border-dashed border-border/40 flex items-center justify-between">
                        <span className="text-[9px] text-text-muted uppercase">
                          Bias Marker:
                        </span>
                        <span className="text-[9px] text-accent uppercase font-mono">
                          {conversation.autonomousMemory.lastEmotionalState}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>

          <main className="lg:col-span-9 flex flex-col order-1 lg:order-2 space-y-6">
            <div className="card-aura flex flex-col min-h-[600px] overflow-hidden">
              <div className="px-6 py-4 border-b border-dashed border-border/60 flex items-center justify-between glass-light">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="font-display text-sm tracking-wide">
                    Transcript Stream
                  </span>
                </div>
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
                  Buffer:{" "}
                  {
                    conversation.messages.filter((m) =>
                      isMessageReleased(m.releaseAt),
                    ).length
                  }{" "}
                  packets
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide max-h-[700px] bg-bg-primary/20">
                <AnimatePresence>
                  {conversation.messages
                    .filter((msg) => isMessageReleased(msg.releaseAt))
                    .map((message, index) => {
                      const isMine = isMyMessage(message.senderId);
                      const sender = isMine ? myPersona : otherPersona;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: isMine ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4 }}
                          className={`flex gap-4 ${isMine ? "flex-row-reverse text-right" : "text-left"}`}
                        >
                          <div
                            className={`w-10 h-10 shrink-0 flex items-center justify-center font-display text-xl border border-dashed transition-all duration-500 ${
                              isMine
                                ? "border-accent text-accent bg-accent/5"
                                : "border-border/60 text-text-muted"
                            }`}
                          >
                            {sender?.name[0]}
                          </div>
                          <div className={`max-w-[80%] space-y-2`}>
                            <div
                              className={`p-5 group relative transition-all duration-300 ${
                                isMine
                                  ? "glass border border-dashed border-accent/40 rounded-sm"
                                  : "glass-light border border-dashed border-border/60 rounded-sm"
                              }`}
                            >
                              {isMine && (
                                <div className="absolute right-0 top-0 w-20 h-20 bg-accent/3 -rotate-45 translate-x-12 -translate-y-12" />
                              )}
                              <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                                {message.text}
                              </p>
                            </div>
                            <div
                              className={`flex items-center gap-3 text-[9px] text-text-muted font-mono uppercase tracking-tighter ${isMine ? "flex-row-reverse" : ""}`}
                            >
                              <span className="opacity-60">
                                {formatTimestamp(message.timestamp)}
                              </span>
                              {message.stage && (
                                <>
                                  <span className="opacity-20">|</span>
                                  <span className="text-accent/60">
                                    Stage: {message.stage}
                                  </span>
                                </>
                              )}
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
                <div className="px-8 py-6 border-t border-dashed border-border/60 glass-light">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: ["8px", "16px", "8px"],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-[2px] bg-accent"
                        />
                      ))}
                    </div>
                    <div>
                      <span className="text-[10px] text-accent font-mono uppercase tracking-[0.2em] block">
                        Transmitting Data...
                      </span>
                      <span className="text-[9px] text-text-muted uppercase tracking-widest">
                        Simulating neural latency
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card border border-dashed border-border/40 p-5 flex items-center gap-5 glass-light relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-accent/3 to-transparent" />
              <div className="w-12 h-12 border border-dashed border-border/60 shrink-0 flex items-center justify-center text-text-muted/40 group">
                <svg
                  className="w-6 h-6 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-display uppercase tracking-widest mb-1">
                  Handler Protocol: Passive Observer
                </div>
                <p className="text-text-muted text-[10px] leading-relaxed tracking-wide uppercase">
                  AUTONOMOUS AGENT ACTIVE. MANUAL INTERVENTION IS RESTRICTED.
                  USE WHISPERS IN DASHBOARD TO INFLUENCE TRAJECTORY.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
