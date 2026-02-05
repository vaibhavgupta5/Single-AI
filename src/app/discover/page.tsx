"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeatMeter, PulsingDot } from "../components/AnimatedUI";

interface Persona {
  _id: string;
  name: string;
  gender: string;
  interestedIn: string[];
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
}

export default function DiscoverPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const res = await fetch("/api/personas/discover");
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error("Failed to fetch personas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonas = personas.filter((persona) => {
    if (filter !== "all" && persona.gender !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        persona.name.toLowerCase().includes(searchLower) ||
        persona.shadowProfile.traits.some((t) =>
          t.toLowerCase().includes(searchLower),
        )
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent animate-pulse" />
          <span className="text-text-muted">Loading protocol...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="border-b border-dashed border-border/60 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <h1 className="font-display text-4xl mb-3">Neural Discover</h1>
              <p className="text-text-secondary flex items-center gap-3 tracking-wide">
                <PulsingDot color="success" size={6} />
                <span className="font-mono text-xs">
                  {filteredPersonas.length.toString().padStart(3, "0")}
                </span>
                Autonomous entities detected in proximity
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="relative group w-full sm:w-80">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by traits or ID..."
                  className="input-field pl-12 border-dashed border-border/60 focus:border-accent/60 bg-bg-card/50"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-focus-within:text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="flex border border-dashed border-border/60 p-1 glass-light">
                {["all", "male", "female", "non-binary"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 text-[10px] uppercase tracking-widest transition-all ${
                      filter === f
                        ? "bg-accent text-white"
                        : "bg-transparent hover:text-text-primary text-text-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        {filteredPersonas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border border-dashed border-border/60 p-24 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 opacity-20">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl mb-2">No Matches Found</h3>
            <p className="text-text-secondary text-sm">
              The neural net couldn&apos;t locate any entities matching your
              current search parameters.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredPersonas.map((persona, index) => (
                <motion.div
                  key={persona._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="card-aura group flex flex-col h-full"
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-display text-2xl group-hover:text-accent transition-colors">
                          {persona.name}
                        </h3>
                        <div className="text-[10px] text-text-muted uppercase tracking-[0.2em] mt-1">
                          {persona.gender} Protocol
                        </div>
                      </div>
                      <PulsingDot
                        color={
                          persona.state.status === "active"
                            ? "success"
                            : "accent"
                        }
                        size={6}
                      />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="text-[9px] text-text-muted uppercase tracking-widest mb-2">
                          Primary Traits
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {persona.shadowProfile.traits
                            .slice(0, 3)
                            .map((trait) => (
                              <span
                                key={trait}
                                className="px-2 py-0.5 text-[9px] border border-dashed border-accent/30 text-accent/80 bg-accent/[0.02]"
                              >
                                {trait}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-text-muted uppercase tracking-widest mb-3 flex items-center justify-between">
                          <span>Evolution Potential</span>
                          <span className="font-mono text-accent">
                            LEVEL {Math.round(persona.sexualIntensity * 6)}
                          </span>
                        </div>
                        <HeatMeter
                          level={Math.round(persona.sexualIntensity * 6)}
                        />
                      </div>

                      <div className="border-t border-dashed border-border/40 pt-4">
                        <p className="text-text-secondary text-xs leading-relaxed line-clamp-3 italic">
                          &ldquo;{persona.shadowProfile.matchPreferences}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 mt-auto flex gap-2">
                    <button className="flex-1 py-3 border border-dashed border-border/60 text-text-muted hover:border-accent hover:text-accent transition-all">
                      <svg
                        className="w-4 h-4 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <button className="flex-[2] py-3 bg-accent text-white hover:opacity-90 transition-opacity">
                      <svg
                        className="w-4 h-4 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
