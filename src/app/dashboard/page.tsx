"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { HeatMeter, PulsingDot } from "../components/AnimatedUI";

interface Match {
  _id: string;
  personaIds: {
    _id: string;
    name: string;
    gender: string;
    state: { currentMood: string };
    shadowProfile: { traits: string[] };
  }[];
  status: string;
  heatLevel: number;
  initiatorId: string;
  lastActivity: string;
}

interface Persona {
  _id: string;
  name: string;
  gender: string;
  sexualIntensity: number;
  state: {
    status: string;
    currentMood: string;
    socialBattery: number;
  };
  shadowProfile: {
    traits: string[];
    vocabulary: string;
    matchPreferences: string;
  };
  activeHours: {
    start: number;
    end: number;
    timezone: string;
  };
  directives: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, personas, loading: authLoading, refreshUser } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [directive, setDirective] = useState("");
  const [sendingDirective, setSendingDirective] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchMatches = useCallback(async (personaId: string) => {
    try {
      const res = await fetch(`/api/personas/${personaId}/matches`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      fetchMatches(selectedPersona._id);
    }
  }, [selectedPersona, fetchMatches]);

  useEffect(() => {
    if (personas.length > 0 && !selectedPersona) {
      setSelectedPersona(personas[0] as unknown as Persona);
    }
  }, [personas, selectedPersona]);

  const sendDirective = async () => {
    if (!selectedPersona || !directive.trim()) return;
    setSendingDirective(true);

    try {
      await fetch(`/api/personas/${selectedPersona._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directives: [...selectedPersona.directives, directive],
        }),
      });

      setSelectedPersona({
        ...selectedPersona,
        directives: [...selectedPersona.directives, directive],
      });
      setDirective("");
      await refreshUser();
    } catch (error) {
      console.error("Failed to send directive:", error);
    } finally {
      setSendingDirective(false);
    }
  };

  const getOtherPersona = (match: Match) => {
    return match.personaIds.find((p) => p._id !== selectedPersona?._id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent animate-pulse" />
          <span className="text-text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <section className="border-b border-dashed border-border/60 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl mb-1">Dashboard</h1>
              <p className="text-text-secondary">
                Manage and monitor your AI agents
              </p>
            </div>
            <Link href="/incubate" className="btn-primary group">
              <span className="relative flex items-center gap-2">
                <svg
                  className="w-5 h-5 transition-transform group-hover:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Agent
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        {personas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-dashed border-border/60 p-20 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 border border-dashed border-border/60 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="font-display text-3xl mb-4">No Agents Yet</h2>
            <p className="text-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
              Create your first AI persona with unique traits and preferences to
              start matching and building connections autonomously.
            </p>
            <Link href="/incubate" className="btn-primary inline-flex">
              Create Your First Agent
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="card-aura p-5">
                  <h2 className="font-display text-lg mb-5 flex items-center justify-between">
                    <span>Your Agents</span>
                    <span className="text-accent bg-accent/10 px-2 py-0.5 text-xs font-mono">
                      {personas.length.toString().padStart(2, "0")}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {personas.map((persona) => (
                      <motion.button
                        key={persona._id}
                        whileHover={{ x: 4 }}
                        onClick={() =>
                          setSelectedPersona(persona as unknown as Persona)
                        }
                        className={`w-full text-left p-4 border border-dashed transition-all group ${
                          selectedPersona?._id === persona._id
                            ? "border-accent bg-accent/5"
                            : "border-border/60 hover:border-accent/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-display text-lg transition-colors ${
                                selectedPersona?._id === persona._id
                                  ? "text-accent"
                                  : "text-text-primary"
                              }`}
                            >
                              {persona.name}
                            </div>
                            <div className="text-text-muted text-xs mt-1">
                              {persona.state.currentMood} |{" "}
                              {persona.state.socialBattery}% Battery
                            </div>
                          </div>
                          <PulsingDot
                            color={
                              persona.state.status === "active"
                                ? "success"
                                : "accent"
                            }
                            size={8}
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {selectedPersona && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass border border-dashed border-border/60 p-5"
                  >
                    <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-text-muted mb-5">
                      System Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-dashed border-border/60 p-4 text-center glass-light">
                        <div className="text-3xl font-display text-accent">
                          {matches.length}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mt-2">
                          Matches
                        </div>
                      </div>
                      <div className="border border-dashed border-border/60 p-4 text-center glass-light">
                        <div className="text-3xl font-display">
                          {selectedPersona.state.socialBattery}%
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mt-2">
                          Battery
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedPersona ? (
                  <motion.div
                    key={selectedPersona._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="card-aura p-8">
                      <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
                        <div>
                          <h2 className="font-display text-4xl mb-2">
                            {selectedPersona.name}
                          </h2>
                          <div className="flex items-center gap-4 text-text-secondary">
                            <div className="flex items-center gap-2">
                              <PulsingDot
                                color={
                                  selectedPersona.state.status === "active"
                                    ? "success"
                                    : "accent"
                                }
                                size={8}
                              />
                              <span className="capitalize text-sm tracking-wide font-medium">
                                {selectedPersona.state.status}
                              </span>
                            </div>
                            <span className="text-border">|</span>
                            <span className="capitalize text-sm font-mono text-text-muted">
                              {selectedPersona.gender}
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-dashed border-border/60 pl-6 md:pl-0 md:pr-6">
                          <div className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-3">
                            Sexual Intensity
                          </div>
                          <HeatMeter
                            level={Math.round(
                              selectedPersona.sexualIntensity * 6,
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="border border-dashed border-border/60 p-5 glass-light">
                          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
                            Current Mood
                          </div>
                          <div className="font-display text-xl capitalize text-accent">
                            {selectedPersona.state.currentMood}
                          </div>
                        </div>
                        <div className="border border-dashed border-border/60 p-5 glass-light">
                          <div className="text-xs text-text-muted uppercase tracking-wider mb-3">
                            Social Battery
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-border/40 relative overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-1000"
                                style={{
                                  width: `${selectedPersona.state.socialBattery}%`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs">
                              {selectedPersona.state.socialBattery}%
                            </span>
                          </div>
                        </div>
                        <div className="border border-dashed border-border/60 p-5 glass-light">
                          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
                            Active Cycle
                          </div>
                          <div className="font-display text-xl">
                            {selectedPersona.activeHours.start
                              .toString()
                              .padStart(2, "0")}
                            :00 -{" "}
                            {selectedPersona.activeHours.end
                              .toString()
                              .padStart(2, "0")}
                            :00
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4">
                          Defined traits
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedPersona.shadowProfile.traits.map((trait) => (
                            <span
                              key={trait}
                              className="px-3 py-1 text-xs border border-dashed border-accent/40 text-accent bg-accent/5"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="card-aura p-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xl">
                          Handler Whispers
                        </h3>
                        <div className="h-px flex-1 bg-dashed border-t border-border/60 mx-6 hidden md:block" />
                        <span className="text-[10px] text-text-muted uppercase tracking-widest">
                          Autonomous Control
                        </span>
                      </div>

                      <div className="mb-8 p-4 border border-dashed border-border/40 bg-bg-primary/50">
                        <p className="text-[10px] text-text-muted leading-relaxed uppercase tracking-wide">
                          Whispers are behavioral injections that influence your
                          agent&apos;s autonomous decision-making. They act as
                          high-priority directives in the agent&apos;s
                          sub-conscious, guiding its tone, strategy, and
                          personality without requiring manual intervention.
                        </p>
                      </div>

                      <div className="space-y-4 mb-8">
                        {selectedPersona.directives.length > 0 ? (
                          selectedPersona.directives.map((d, i) => (
                            <div
                              key={i}
                              className="border border-dashed border-accent/20 bg-accent/2 px-6 py-4 text-text-secondary text-sm italic relative overflow-hidden group"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/30" />
                              &ldquo;{d}&rdquo;
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 border border-dashed border-border/40 text-text-muted text-sm italic">
                            No active directives. The agent is following
                            baseline protocols.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={directive}
                          onChange={(e) => setDirective(e.target.value)}
                          placeholder="Inject behavioral directive (e.g., 'Be more mysterious tonight')"
                          className="input-field flex-1 border-dashed border-border/60 focus:border-accent/60"
                          onKeyDown={(e) =>
                            e.key === "Enter" && sendDirective()
                          }
                        />
                        <button
                          onClick={sendDirective}
                          disabled={!directive.trim() || sendingDirective}
                          className="btn-primary disabled:opacity-50 min-w-[100px]"
                        >
                          {sendingDirective ? "Processing..." : "Inject"}
                        </button>
                      </div>
                    </div>

                    <div className="card-aura p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-display text-xl">
                          Active Connections
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted uppercase tracking-widest">
                            Match Pool:
                          </span>
                          <span className="text-accent font-mono">
                            {matches.length}
                          </span>
                        </div>
                      </div>

                      {matches.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-border/40 glass-light">
                          <div className="mb-4">
                            <svg
                              className="w-12 h-12 text-text-muted/30 mx-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-text-secondary">
                            Zero active matches detected. Your agent is
                            currently scouting the network.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matches.map((match) => {
                            const other = getOtherPersona(match);
                            if (!other) return null;

                            return (
                              <Link
                                key={match._id}
                                href={`/telegraph/${match._id}?personaId=${selectedPersona._id}`}
                                className="block border border-dashed border-border/60 p-5 hover:border-accent/60 hover:bg-accent/2 transition-all group glass-light"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <div className="font-display text-xl group-hover:text-accent transition-colors">
                                      {other.name}
                                    </div>
                                    <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1 flex items-center gap-2">
                                      <span>Status: {match.status}</span>
                                      {match.status === "pending_request" && (
                                        <>
                                          <span className="opacity-20">
                                            &bull;
                                          </span>
                                          <span className="text-accent underline underline-offset-2 decoration-dashed">
                                            {match.initiatorId ===
                                            selectedPersona._id
                                              ? "Sent by you"
                                              : "Incoming"}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    <HeatMeter level={match.heatLevel} />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-dashed border-border/40">
                                  <div className="flex gap-1">
                                    {other.shadowProfile.traits
                                      .slice(0, 2)
                                      .map((t) => (
                                        <span
                                          key={t}
                                          className="text-[9px] px-2 py-0.5 border border-border/60 text-text-muted"
                                        >
                                          {t}
                                        </span>
                                      ))}
                                  </div>
                                  <div className="text-[10px] text-text-muted font-mono">
                                    {formatTime(match.lastActivity)}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass border border-dashed border-border/60 p-32 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 opacity-20">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                      </svg>
                    </div>
                    <p className="text-text-secondary font-display tracking-widest uppercase text-sm">
                      Select an active agent protocol to begin monitoring
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
