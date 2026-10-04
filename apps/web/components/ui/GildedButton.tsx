"use client";

import React from "react";
import Link from "next/link";

interface GildedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "gold" | "crimson" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function GildedButton({
  children,
  onClick,
  href,
  variant = "gold",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}: GildedButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs tracking-wider",
    md: "px-6 py-3 text-sm tracking-widest",
    lg: "px-8 py-4 text-base tracking-widest font-semibold",
  }[size];

  const variantClasses = {
    gold: "bg-gradient-to-b from-[#241a12] to-[#120d09] text-[#e5c378] border-[#c6a15b] hover:border-[#f3db98] hover:text-[#fff0cc] shadow-[0_0_15px_rgba(198,161,91,0.25)] hover:shadow-[0_0_25px_rgba(198,161,91,0.5)] active:scale-[0.98]",
    crimson: "bg-gradient-to-b from-[#2b1010] to-[#140606] text-[#ff8f8f] border-[#8c2727] hover:border-[#d93b3b] hover:text-[#ffd6d6] shadow-[0_0_15px_rgba(140,39,39,0.3)] hover:shadow-[0_0_25px_rgba(217,59,59,0.5)] active:scale-[0.98]",
    dark: "bg-gradient-to-b from-[#181310] to-[#0d0908] text-[#c7b59d] border-[#3d2e24] hover:border-[#c6a15b] hover:text-[#e6d7c3] shadow-[0_0_10px_rgba(0,0,0,0.5)] active:scale-[0.98]",
  }[variant];

  const baseClasses = `relative inline-flex items-center justify-center font-['Cinzel',serif] uppercase transition-all duration-200 border rounded-sm select-none overflow-hidden group ${sizeClasses} ${variantClasses} ${
    disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"
  } ${className}`;

  const innerContent = (
    <>
      {/* Corner antique brackets */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#c6a15b] opacity-80" />
      <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#c6a15b] opacity-80" />
      <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#c6a15b] opacity-80" />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#c6a15b] opacity-80" />

      {/* Hover brass sheen effect */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[rgba(245,215,140,0.12)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={baseClasses}>
      {innerContent}
    </button>
  );
}
