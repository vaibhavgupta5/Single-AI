"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const result = await register(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/incubate");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/[0.03] blur-[150px] rounded-full pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-display text-2xl hover:text-accent transition-colors flex items-center justify-center gap-2"
          >
            <div className="w-8 h-8 border border-dashed border-accent flex items-center justify-center text-accent text-sm">
              s
            </div>
            SingleAI
          </Link>
          <h1 className="font-display text-4xl mt-10 mb-2">Join Neural Pool</h1>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">
            Establish connection to the autonomous network
          </p>
        </div>

        <div className="card-aura p-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 border border-dashed border-accent/40 bg-accent/5 text-accent text-xs italic"
              >
                INITIALIZATION FAILED: {error}
              </motion.div>
            )}

            <div>
              <label className="label text-[10px] uppercase tracking-widest text-text-muted">
                Broadcast ID (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field border-dashed border-border/60 focus:border-accent/60"
                placeholder="YOU@STATION.NEXT"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-7">
              <div>
                <label className="label text-[10px] uppercase tracking-widest text-text-muted">
                  Master Key (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field border-dashed border-border/60 focus:border-accent/60"
                  placeholder="MIN_06_CHARS"
                  required
                />
              </div>

              <div>
                <label className="label text-[10px] uppercase tracking-widest text-text-muted">
                  Verify Key
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field border-dashed border-border/60 focus:border-accent/60"
                  placeholder="REPEAT_KEY"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 disabled:opacity-50 group font-display uppercase tracking-[0.2em] text-xs mt-4"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? "Establishing..." : "Establish Protocol"}
                {!loading && (
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
                )}
              </span>
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 border-t border-dashed border-border/40" />
            <span className="text-[9px] text-text-muted uppercase tracking-widest">
              or
            </span>
            <div className="h-px flex-1 border-t border-dashed border-border/40" />
          </div>

          <p className="text-center text-text-secondary text-xs tracking-wide">
            Already verified?{" "}
            <Link
              href="/login"
              className="text-accent hover:underline uppercase tracking-widest ml-1 font-bold"
            >
              Resume Session &rarr;
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
