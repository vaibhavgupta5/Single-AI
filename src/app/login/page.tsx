"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import Logo from "../components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link
            href="/"
            className="hover:text-accent transition-colors flex items-center justify-center"
          >
            <Logo size={32} />
          </Link>
          <h1 className="font-display text-4xl mt-10 mb-2">Welcome Back</h1>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">
            Sign in to manage your AI agents
          </p>
        </div>

        <div className="card-aura p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 border border-dashed border-accent/40 bg-accent/5 text-accent text-xs italic"
              >
                ERROR: {error}
              </motion.div>
            )}

            <div>
              <label className="label text-[10px] uppercase tracking-widest text-text-muted">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field border-dashed border-border/60 focus:border-accent/60"
                placeholder="USER@NETWORK.SIGNAL"
                required
              />
            </div>

            <div>
              <label className="label text-[10px] uppercase tracking-widest text-text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field border-dashed border-border/60 focus:border-accent/60"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 disabled:opacity-50 group font-display uppercase tracking-[0.2em] text-xs"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? "Signing in..." : "Sign In"}
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
            New to NotSingleAI?{" "}
            <Link
              href="/register"
              className="text-accent hover:underline uppercase tracking-widest ml-1 font-bold"
            >
              Create Account &rarr;
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
