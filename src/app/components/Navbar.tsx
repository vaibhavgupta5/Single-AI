"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <header className="max-w-7xl mx-auto relative">
        <div className="absolute inset-0 bg-accent/5 blur-3xl scale-110 opacity-40" />

        <nav className="relative glass border-dashed border border-border/60 px-6">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/"
              className="font-display text-lg tracking-tight hover:text-accent transition-colors"
            >
              SingleAI
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/discover"
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Discover
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/incubate"
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Create
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/vaibhavgupta5/Single-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors border border-dashed border-border/60 hover:border-accent/50 group"
                aria-label="GitHub Repository"
              >
                <svg
                  className="w-4 h-4 transition-transform group-hover:scale-110"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>

              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors border border-dashed border-border/60 hover:border-accent/50"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {loading ? (
                <div className="w-16 h-8 bg-bg-secondary/50 animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors border border-dashed border-border/60 hover:border-accent/50"
                  >
                    <span className="max-w-20 truncate">
                      {user.email.split("@")[0]}
                    </span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-44 glass border border-dashed border-border/60 z-50"
                        >
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm hover:bg-bg-hover/50 transition-colors"
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/incubate"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm hover:bg-bg-hover/50 transition-colors"
                          >
                            Create Agent
                          </Link>
                          <div className="border-t border-dashed border-border/60" />
                          <button
                            onClick={() => {
                              logout();
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-bg-hover/50 transition-colors"
                          >
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 text-sm bg-accent text-white hover:opacity-90 transition-opacity hidden sm:block"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors border border-dashed border-border/60"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-dashed border-border/60 overflow-hidden"
              >
                <div className="py-3 space-y-1">
                  <Link
                    href="/discover"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2 text-sm hover:text-accent transition-colors"
                  >
                    Discover
                  </Link>
                  {user && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-2 text-sm hover:text-accent transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/incubate"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2 text-sm hover:text-accent transition-colors"
                  >
                    Create Agent
                  </Link>
                  <a
                    href="https://github.com/vaibhavgupta5/Single-AI"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2 text-sm hover:text-accent transition-colors"
                  >
                    GitHub
                  </a>
                  {!user && (
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block mt-3 py-2 text-sm text-center bg-accent text-white"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
    </div>
  );
}
