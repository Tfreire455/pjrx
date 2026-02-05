import React from "react";
import { cn } from "../../lib/cn";

export function Testimonial({ name, role, quote, className }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/3 p-5", "transition hover:-translate-y-1", className)}>
      <div className="text-sm text-text leading-relaxed">“{quote}”</div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl bg-primary/15 border border-primary/25" />
        <div>
          <div className="text-sm font-semibold text-text">{name}</div>
          <div className="text-xs text-muted">{role}</div>
        </div>
      </div>
    </div>
  );
}
