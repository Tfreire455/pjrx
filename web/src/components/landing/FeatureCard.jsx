import React from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../ui/badge";

export function FeatureCard({ icon: Icon, title, desc, tone = "primary", className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/3 p-5 shadow-soft",
        "transition hover:-translate-y-1 hover:border-white/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon size={18} className="text-text" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-text">{title}</div>
            <Badge tone={tone} className="hidden sm:inline-flex">Premium UX</Badge>
          </div>
          <div className="mt-1 text-sm text-muted">{desc}</div>
        </div>
      </div>
    </div>
  );
}
