import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./button";

export function EmptyState({ title, subtitle, actionLabel, onAction, icon: Icon = Sparkles }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/20 border border-primary/25 flex items-center justify-center">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="mt-3 text-sm font-semibold text-text">{title}</div>
      <div className="mt-1 text-sm text-muted">{subtitle}</div>
      {actionLabel ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
