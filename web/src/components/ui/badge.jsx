import React from "react";
import { cn } from "../../lib/cn";

export function Badge({ className, tone = "neutral", ...props }) {
  const tones = {
    neutral: "bg-white/8 text-text border-white/10",
    primary: "bg-primary/15 text-primary border-primary/25",
    success: "bg-success/15 text-success border-success/25",
    warning: "bg-warning/15 text-warning border-warning/25",
    danger: "bg-danger/15 text-danger border-danger/25",
    secondary: "bg-secondary/15 text-secondary border-secondary/25"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
