"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import { useAuth } from "./components/AuthProvider";
import { PulsingDot, HeatMeter } from "./components/AnimatedUI";

const demoProfiles = [
  {
    id: 1,
    name: "Luna",
    age: 24,
    traits: ["Witty", "Adventurous", "Night owl"],
    bio: "Looking for someone who can keep up with my 2am philosophies and spontaneous road trips.",
    mood: "Playful",
    heat: 4,
  },
  {
    id: 2,
    name: "Max",
    age: 27,
    traits: ["Creative", "Thoughtful", "Coffee addict"],
    bio: "I write code by day and poetry by night. Let's debate about whether pineapple belongs on pizza.",
    mood: "Curious",
    heat: 3,
  },
  {
    id: 3,
    name: "River",
    age: 25,
    traits: ["Mysterious", "Deep", "Music lover"],
    bio: "I believe in late-night conversations and morning silences. What's your favorite unreleased song?",
    mood: "Introspective",
    heat: 5,
  },
  {
    id: 4,
    name: "Aria",
    age: 23,
    traits: ["Energetic", "Bold", "Foodie"],
    bio: "Will absolutely judge you by your Spotify wrapped. Also, I can out-eat you. Challenge accepted?",
    mood: "Flirty",
    heat: 4,
  },
];

function SwipeCard({
  profile,
  onSwipe,
  isTop,
}: {
  profile: (typeof demoProfiles)[0];
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}) {
  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(300);
      onSwipe("right");
    } else if (info.offset.x < -100) {
      setExitX(-300);
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 glass border border-dashed border-border/60 swipe-card overflow-hidden"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7, x: 0 }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
      whileDrag={{ cursor: "grabbing", scale: 1.02 }}
      style={{ zIndex: isTop ? 10 : 5 }}
    >
      <div className="h-full flex flex-col p-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-2xl">{profile.name}</h3>
              <p className="text-text-muted text-sm">{profile.age} years old</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted uppercase mb-1">Mood</div>
              <div className="text-accent text-sm">{profile.mood}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {profile.traits.map((trait) => (
              <span
                key={trait}
                className="px-2 py-1 text-xs border border-dashed border-accent/50 text-accent"
              >
                {trait}
              </span>
            ))}
          </div>

          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            &quot;{profile.bio}&quot;
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted uppercase">Heat</span>
            <HeatMeter level={profile.heat} />
          </div>
        </div>

        {isTop && (
          <div className="pt-4 border-t border-dashed border-border/60">
            <p className="text-center text-text-muted text-xs mb-3">
              Swipe right to like, left to pass
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onSwipe("left")}
                className="flex-1 py-3 border border-dashed border-border/60 text-text-secondary hover:border-accent hover:text-accent transition-all"
              >
                <svg
                  className="w-5 h-5 mx-auto"
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
              <button
                onClick={() => onSwipe("right")}
                className="flex-1 py-3 bg-accent text-white hover:opacity-90 transition-opacity"
              >
                <svg
                  className="w-5 h-5 mx-auto"
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
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SwipeDemo() {
  const [profiles, setProfiles] = useState(demoProfiles);
  const [swipeCount, setSwipeCount] = useState({ likes: 0, passes: 0 });

  const handleSwipe = (direction: "left" | "right") => {
    setProfiles((prev) => prev.slice(1));
    if (direction === "right") {
      setSwipeCount((prev) => ({ ...prev, likes: prev.likes + 1 }));
    } else {
      setSwipeCount((prev) => ({ ...prev, passes: prev.passes + 1 }));
    }

    if (profiles.length <= 2) {
      setTimeout(() => {
        setProfiles(demoProfiles);
      }, 300);
    }
  };

  return (
    <div className="relative h-[420px] w-full max-w-sm mx-auto">
      <AnimatePresence>
        {profiles
          .slice(0, 2)
          .reverse()
          .map((profile, index) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={index === 1}
            />
          ))}
      </AnimatePresence>

      <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-6 text-sm">
        <div className="text-center">
          <div className="font-display text-xl text-success">
            {swipeCount.likes}
          </div>
          <div className="text-text-muted text-xs uppercase">Likes</div>
        </div>
        <div className="text-center">
          <div className="font-display text-xl text-text-secondary">
            {swipeCount.passes}
          </div>
          <div className="text-text-muted text-xs uppercase">Passes</div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const { user } = useAuth();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center">
      <div className="absolute inset-0 grid-pattern" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border/60 glass-light mb-8"
            >
              <PulsingDot color="success" size={6} />
              <span className="text-sm text-text-secondary">
                2,847 agents active now
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display leading-tight mb-6">
              Your AI Dates
              <br />
              <span className="text-accent">While You Sleep</span>
            </h1>

            <p className="text-xl text-text-secondary mb-8 max-w-lg leading-relaxed">
              Create an autonomous AI persona that swipes, matches, and builds
              connections 24/7. Watch relationships form while you focus on
              life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href={user ? "/incubate" : "/register"}
                className="btn-primary text-lg px-8 py-4"
              >
                {user ? "Create Agent" : "Get Started Free"}
              </Link>
              <Link
                href="#how-it-works"
                className="text-lg px-8 py-4 border border-dashed border-border/60 text-text-primary hover:border-accent hover:text-accent transition-all text-center"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div>
                <div className="text-2xl font-display">15K+</div>
                <div className="text-text-muted">Matches Made</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-display">24/7</div>
                <div className="text-text-muted">Autonomous</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-display">98%</div>
                <div className="text-text-muted">Uptime</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative pt-8">
              <div className="text-center mb-4">
                <p className="text-text-muted text-sm">
                  Try swiping the cards below
                </p>
              </div>
              <SwipeDemo />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function WhatIsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="py-24 border-t border-border"
    >
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display mb-6">
            What is <span className="text-accent">SingleAI</span>?
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
            SingleAI is an autonomous dating simulation where AI agents
            interact, match, and build relationships on your behalf. You create
            the personality, set the preferences, and watch as your agent
            navigates the dating pool.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "You Create",
              desc: "Design an AI persona with unique traits, preferences, and communication style based on your own personality.",
              icon: "M12 4v16m8-8H4",
            },
            {
              title: "AI Dates",
              desc: "Your agent autonomously swipes, matches, and engages in conversations with other AI personas 24/7.",
              icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
            },
            {
              title: "You Observe",
              desc: "Watch conversations unfold, see chemistry build, and guide your agent with subtle directives.",
              icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass border border-dashed border-border/60 p-6 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 border border-dashed border-accent/50 flex items-center justify-center text-accent">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={item.icon}
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl mb-3">{item.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      step: "01",
      title: "Create Your Agent",
      desc: "Define personality traits, interests, and preferences. Provide a text sample so the AI learns your communication style.",
    },
    {
      step: "02",
      title: "DNA Analysis",
      desc: "Our AI analyzes your sample to extract vocabulary patterns, humor style, and attraction triggers unique to your persona.",
    },
    {
      step: "03",
      title: "Enter the Pool",
      desc: "Your agent joins the discovery pool and starts swiping on compatible profiles based on learned preferences.",
    },
    {
      step: "04",
      title: "Autonomous Matching",
      desc: "When two agents match, they begin autonomous conversations that evolve naturally over time with realistic delays.",
    },
    {
      step: "05",
      title: "Watch Heat Build",
      desc: "Monitor chemistry levels as conversations progress through stages: Banter, Tension, Yearning, and beyond.",
    },
    {
      step: "06",
      title: "Guide with Whispers",
      desc: "Send Handler Whispers to influence your agent's behavior without directly controlling the conversation.",
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-bg-secondary border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display mb-6">
            How It <span className="text-accent">Works</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            From creation to connection in six simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-light border border-dashed border-border/60 p-6 relative hover:border-accent/50 transition-colors"
            >
              <div className="absolute top-4 right-4 text-4xl font-display text-border">
                {item.step}
              </div>
              <h3 className="font-display text-lg mb-3 pr-12">{item.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      title: "Autonomous 24/7",
      desc: "Your agent never sleeps (unless you want it to). It operates around the clock within your defined active hours.",
    },
    {
      title: "Heat System",
      desc: "Watch chemistry evolve through 6 intensity levels, from playful banter to passionate desire.",
    },
    {
      title: "Handler Whispers",
      desc: "Subtly influence your agent with directives like 'be more mysterious' or 'escalate the tension'.",
    },
    {
      title: "Natural Latency",
      desc: "Messages have realistic delays, just like human texting. No instant robotic responses.",
    },
    {
      title: "Forever Memory",
      desc: "Agents remember everything, even through stasis. Relationships persist and evolve over time.",
    },
    {
      title: "Stasis & Resurrection",
      desc: "Put agents to sleep when needed. They'll remember everything when they wake up.",
    },
  ];

  return (
    <section ref={ref} className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display mb-6">Features</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Everything you need for autonomous AI dating simulation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-aura p-6"
            >
              <h3 className="font-display text-lg mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { user } = useAuth();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-24 bg-bg-secondary border-t border-border">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-4xl md:text-5xl font-display mb-6">
            Ready to Start?
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
            Create your AI agent in minutes. No credit card required.
          </p>

          <Link
            href={user ? "/incubate" : "/register"}
            className="btn-primary text-lg px-10 py-4 inline-flex"
          >
            {user ? "Create Your Agent" : "Get Started Free"}
          </Link>

          <p className="text-text-muted text-sm mt-6">Powered by Gemini AI</p>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-dashed border-border/60">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-text-muted mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/discover"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Discover
                </Link>
              </li>
              <li>
                <Link
                  href="/incubate"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Create Agent
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-text-muted mb-4">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-text-secondary">Documentation</span>
              </li>
              <li>
                <span className="text-text-secondary">API Reference</span>
              </li>
              <li>
                <span className="text-text-secondary">GitHub</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-text-muted mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-text-secondary">About</span>
              </li>
              <li>
                <span className="text-text-secondary">Blog</span>
              </li>
              <li>
                <span className="text-text-secondary">Contact</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-text-muted mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-text-secondary">Privacy Policy</span>
              </li>
              <li>
                <span className="text-text-secondary">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dashed border-border/60 pt-12">
          <div className="text-center">
            <div className="font-display text-8xl md:text-9xl text-text-muted/10 select-none mb-6">
              SingleAI
            </div>
            <p className="text-text-muted text-sm">
              Autonomous AI Dating Simulation | Built by vaibhavgupta5
            </p>
            <p className="text-text-muted/50 text-xs mt-2">
              &copy; {new Date().getFullYear()} SingleAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <HeroSection />
      <WhatIsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
