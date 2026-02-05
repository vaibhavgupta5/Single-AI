"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { HeatMeter } from "../components/AnimatedUI";

interface DNAResult {
  traits: string[];
  vocabulary: string;
  matchPreferences: string;
}

export default function IncubatePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    interestedIn: ["male"],
    geminiApiKey: "",
    sample: "",
    sexualIntensity: 0.5,
    activeStart: 22,
    activeEnd: 4,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [dnaResult, setDnaResult] = useState<DNAResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const analyzeDNA = async () => {
    if (!formData.sample || !formData.geminiApiKey) {
      setError("Please provide both a text sample and API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample: formData.sample,
          apiKey: formData.geminiApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze DNA");
      }

      setDnaResult(data);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze DNA");
    } finally {
      setLoading(false);
    }
  };

  const createPersona = async () => {
    if (!dnaResult) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user?.id,
          name: formData.name,
          gender: formData.gender,
          interestedIn: formData.interestedIn,
          sexualIntensity: formData.sexualIntensity,
          activeHours: {
            start: formData.activeStart,
            end: formData.activeEnd,
            timezone: formData.timezone,
          },
          state: {
            status: "active",
            currentMood: "curious",
            socialBattery: 100,
          },
          shadowProfile: dnaResult,
          directives: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create persona");
      }

      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          gemini_api_key: formData.geminiApiKey,
        }),
      });

      await refreshUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent animate-pulse" />
          <span className="text-text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="border-b border-dashed border-border/60 bg-bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="font-display text-4xl mb-2">Incubate Protocol</h1>
          <p className="text-text-secondary tracking-wide">
            Synthesizing autonomous personality matrix in 3 phases
          </p>

          <div className="flex items-center gap-4 mt-12">
            {[
              { n: 1, label: "Identity" },
              { n: 2, label: "DNA Sample" },
              { n: 3, label: "Review" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 flex items-center justify-center font-display text-xl border border-dashed transition-all duration-500 ${
                    step >= s.n
                      ? "bg-accent border-accent text-white"
                      : "border-border/60 text-text-muted bg-bg-card/30"
                  }`}
                >
                  {step > s.n ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    s.n.toString().padStart(2, "0")
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] hidden sm:block ${step >= s.n ? "text-text-primary" : "text-text-muted"}`}
                >
                  {s.label}
                </span>
                {i < 2 && (
                  <div
                    className={`w-12 h-px border-t border-dashed ${step > s.n ? "border-accent" : "border-border/40"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 border border-dashed border-accent/40 bg-accent/5 text-accent text-sm"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {error}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card-aura p-10"
            >
              <h2 className="font-display text-2xl mb-10 flex items-center gap-4">
                <span className="text-accent underline underline-offset-8 decoration-dashed">
                  01
                </span>
                Identity Matrix
              </h2>

              <div className="space-y-10">
                <div>
                  <label className="label">Agent Identifier</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field text-xl border-dashed border-border/60 focus:border-accent/60"
                    placeholder="e.g., LUNA-01"
                  />
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mt-2">
                    The unique identifier for your synthetic persona
                  </p>
                </div>

                <div>
                  <label className="label">
                    Gemini Neural Interface (API Key)
                  </label>
                  <input
                    type="password"
                    value={formData.geminiApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, geminiApiKey: e.target.value })
                    }
                    className="input-field border-dashed border-border/60 focus:border-accent/60"
                    placeholder="ENTER_API_KEY"
                  />
                  <p className="text-[10px] text-text-muted mt-3 flex items-center justify-between">
                    <span>KEY STORED LOCALLY ONLY</span>
                    <a
                      href="https://aistudio.google.com"
                      target="_blank"
                      className="text-accent hover:underline tracking-widest uppercase"
                    >
                      Retrieve Key &rarr;
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="label">Primary Gender</label>
                    <div className="flex flex-col gap-3">
                      {["male", "female", "non-binary"].map((g) => (
                        <button
                          key={g}
                          onClick={() =>
                            setFormData({ ...formData, gender: g })
                          }
                          className={`px-5 py-3 border border-dashed capitalize transition-all text-left text-sm ${
                            formData.gender === g
                              ? "border-accent bg-accent/5 text-accent"
                              : "border-border/60 text-text-muted hover:border-text-secondary"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            {g}
                            {formData.gender === g && (
                              <div className="w-1.5 h-1.5 bg-accent" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Social Orientation</label>
                    <div className="flex flex-col gap-3">
                      {["male", "female", "non-binary"].map((g) => {
                        const isSelected = formData.interestedIn.includes(g);
                        return (
                          <button
                            key={g}
                            onClick={() => {
                              const current = formData.interestedIn;
                              const updated = isSelected
                                ? current.filter((x) => x !== g)
                                : [...current, g];
                              if (updated.length > 0) {
                                setFormData({
                                  ...formData,
                                  interestedIn: updated,
                                });
                              }
                            }}
                            className={`px-5 py-3 border border-dashed capitalize transition-all text-left text-sm ${
                              isSelected
                                ? "border-accent bg-accent/5 text-accent"
                                : "border-border/60 text-text-muted hover:border-text-secondary"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              {g}
                              <div
                                className={`w-3 h-3 border border-dashed transition-all ${
                                  isSelected
                                    ? "border-accent bg-accent"
                                    : "border-border/60"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.geminiApiKey}
                  className="btn-primary w-full py-5 disabled:opacity-50 group"
                >
                  <span className="flex items-center justify-center gap-2">
                    Initialize Phase 02
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card-aura p-10"
            >
              <h2 className="font-display text-2xl mb-10 flex items-center gap-4">
                <span className="text-accent underline underline-offset-8 decoration-dashed">
                  02
                </span>
                Behavioral DNA
              </h2>

              <div className="space-y-10">
                <div>
                  <label className="label">Linguistic DNA Sample</label>
                  <textarea
                    value={formData.sample}
                    onChange={(e) =>
                      setFormData({ ...formData, sample: e.target.value })
                    }
                    className="input-field min-h-48 resize-none border-dashed border-border/60 focus:border-accent/60 font-mono text-sm leading-relaxed"
                    placeholder="Paste conversational telemetry here... (e.g., private messages, stream of consciousness, personal essays)"
                  />
                  <p className="text-[10px] text-text-muted mt-3 leading-relaxed tracking-wider">
                    OUR LLM WILL EXTRACT VOCABULARY PATTERNS, TONALITY, AND
                    ARCHETYPICAL TRAITS FROM THIS DATA.
                  </p>
                </div>

                <div>
                  <label className="label flex items-center justify-between mb-4">
                    <span>Libido Calibration</span>
                    <span className="text-accent font-mono text-xs">
                      LEVEL:{" "}
                      {Math.round(formData.sexualIntensity * 10)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={formData.sexualIntensity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sexualIntensity: parseFloat(e.target.value),
                      })
                    }
                    className="slider-track w-full opacity-60 hover:opacity-100 transition-opacity"
                  />
                  <div className="mt-6 flex items-center gap-4 border border-dashed border-border/40 p-4 glass-light">
                    <div className="text-[9px] text-text-muted uppercase tracking-widest shrink-0">
                      Intensity Viz:
                    </div>
                    <HeatMeter
                      level={Math.round(formData.sexualIntensity * 6)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="label">Neural Boot</label>
                    <select
                      value={formData.activeStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activeStart: parseInt(e.target.value),
                        })
                      }
                      className="input-field border-dashed border-border/60"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} className="bg-bg-card">
                          {i.toString().padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Neural Hibernate</label>
                    <select
                      value={formData.activeEnd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activeEnd: parseInt(e.target.value),
                        })
                      }
                      className="input-field border-dashed border-border/60"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} className="bg-bg-card">
                          {i.toString().padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-5 border border-dashed border-border/60 text-text-muted hover:text-text-primary hover:border-text-muted transition-all flex-1 text-sm uppercase tracking-widest"
                  >
                    Previous
                  </button>
                  <button
                    onClick={analyzeDNA}
                    disabled={!formData.sample || loading}
                    className="btn-primary flex-[2] py-5 disabled:opacity-50 font-display uppercase tracking-widest text-sm"
                  >
                    {loading ? "Sequencing DNA..." : "Sequence & Analyze"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && dnaResult && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card-aura p-10"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 border border-dashed border-success flex items-center justify-center text-success relative">
                  <div className="absolute inset-0 bg-success/10 animate-pulse" />
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-2xl">
                    Phase Analysis Complete
                  </h2>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest">
                    Synthetic matrix verified
                  </p>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <label className="label">Extracted Personality Tokens</label>
                  <div className="flex flex-wrap gap-2">
                    {dnaResult.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-3 py-1 text-xs border border-dashed border-accent/40 text-accent bg-accent/5"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="label">Linguistic Profile</label>
                    <div className="border border-dashed border-accent/20 bg-accent/[0.02] p-6 relative">
                      <div className="absolute left-0 top-0 w-1 h-full bg-accent/30" />
                      <p className="text-text-secondary text-sm leading-relaxed italic">
                        &ldquo;{dnaResult.vocabulary}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label">Relational Preference</label>
                    <div className="border border-dashed border-border/40 bg-bg-card/50 p-6">
                      <p className="text-text-muted text-sm leading-relaxed">
                        {dnaResult.matchPreferences}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-border/40 pt-10">
                  <div className="glass border border-dashed border-border/60 p-8 hover:border-accent/40 transition-all group">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-3">
                          Manifesting Identity
                        </div>
                        <div className="font-display text-3xl group-hover:text-accent transition-colors">
                          {formData.name}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-widest mt-2 font-mono">
                          {formData.gender} &bull; ORIENTATION:{" "}
                          {formData.interestedIn.join("+")}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="text-[9px] text-text-muted uppercase mb-3">
                          Heat Check
                        </div>
                        <HeatMeter
                          level={Math.round(formData.sexualIntensity * 6)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-5 border border-dashed border-border/60 text-text-muted hover:text-text-primary hover:border-text-muted transition-all flex-1 text-sm uppercase tracking-widest"
                  >
                    Modify DNA
                  </button>
                  <button
                    onClick={createPersona}
                    disabled={loading}
                    className="btn-primary flex-[2] py-5 disabled:opacity-50 font-display uppercase tracking-widest text-sm relative overflow-hidden"
                  >
                    {loading && (
                      <div className="absolute inset-0 bg-accent/20 animate-pulse" />
                    )}
                    {loading ? "Synthesizing Persona..." : "Manifest Agent"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
