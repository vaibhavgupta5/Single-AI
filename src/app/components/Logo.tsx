"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  fontSize?: string;
  iconColor?: string;
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "1.5em",
  showText = true,
  fontSize,
  iconColor = "text-accent",
}) => {
  return (
    <div className={`inline-flex items-center gap-[0.4em] ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconColor} shrink-0`}
      >
        <path
          fill="currentColor"
          d="M 50 90 L 5 40 L 25 5 L 50 35 L 75 5 L 95 40 Z"
        />
      </svg>
      {showText && (
        <span
          className="font-display tracking-tight"
          style={{ fontSize: fontSize || "1.125rem" }}
        >
          NotSingleAI
        </span>
      )}
    </div>
  );
};

export default Logo;
