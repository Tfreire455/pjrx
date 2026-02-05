import React from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white/6", className)}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      <div className="opacity-0">.</div>
    </div>
  );
}
