"use client";

import { motion } from "framer-motion";

export function PulsingDot({
  color = "accent",
  size = 8,
}: {
  color?: "accent" | "success";
  size?: number;
}) {
  return (
    <span className="relative inline-flex">
      <span
        className="absolute inline-flex h-full w-full animate-ping opacity-75"
        style={{
          width: size,
          height: size,
          backgroundColor:
            color === "success" ? "var(--success)" : "var(--accent)",
        }}
      />
      <span
        className="relative inline-flex"
        style={{
          width: size,
          height: size,
          backgroundColor:
            color === "success" ? "var(--success)" : "var(--accent)",
        }}
      />
    </span>
  );
}

export function HeatMeter({
  level,
  variant = "horizontal",
}: {
  level: number;
  variant?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={`flex ${variant === "horizontal" ? "gap-1 flex-row items-end" : "gap-1 flex-col-reverse items-start"}`}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          className={variant === "horizontal" ? "w-2" : "h-1.5 w-6"}
          style={{
            height: variant === "horizontal" ? `${3 + i * 3}px` : undefined,
            backgroundColor:
              i <= level
                ? i <= 2
                  ? "#22c55e"
                  : i <= 4
                    ? "#f59e0b"
                    : "var(--accent)"
                : "var(--border)",
          }}
          initial={variant === "horizontal" ? { scaleY: 0 } : { scaleX: 0 }}
          animate={variant === "horizontal" ? { scaleY: 1 } : { scaleX: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

export function AnimatedCounter({
  value,
  suffix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {value.toLocaleString()}
      {suffix}
    </motion.span>
  );
}
