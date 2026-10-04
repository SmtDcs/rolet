"use client";

import React from "react";

interface ParchmentSealProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  variant?: "gold" | "crimson" | "parchment";
  className?: string;
}

export function ParchmentSeal({
  label,
  sublabel,
  icon,
  variant = "gold",
  className = "",
}: ParchmentSealProps) {
  const styles = {
    gold: {
      border: "border-[#c6a15b]",
      text: "text-[#e5c378]",
      bg: "bg-[#18130e]/90",
      glow: "shadow-[0_0_12px_rgba(198,161,91,0.2)]",
    },
    crimson: {
      border: "border-[#8c2727]",
      text: "text-[#f28b82]",
      bg: "bg-[#1f0b0b]/90",
      glow: "shadow-[0_0_12px_rgba(140,39,39,0.3)]",
    },
    parchment: {
      border: "border-[#5c4a38]",
      text: "text-[#e6d7c3]",
      bg: "bg-[#14100c]/90",
      glow: "shadow-[0_0_8px_rgba(0,0,0,0.6)]",
    },
  }[variant];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 border rounded-sm font-sans ${styles.border} ${styles.bg} ${styles.text} ${styles.glow} ${className}`}
    >
      {icon && <span className="text-sm opacity-90">{icon}</span>}
      <div className="flex flex-col leading-none">
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
        {sublabel && (
          <span className="text-[9px] font-['Space_Mono',monospace] opacity-60 tracking-normal mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
