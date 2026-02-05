import React from "react";
import { cn } from "../../lib/cn";

export function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn("w-full", className)} data-value={value}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { value, onValueChange });
      })}
    </div>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={cn("flex gap-2 rounded-2xl border border-white/10 bg-white/3 p-1", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value: current, onValueChange, tabValue, children }) {
  const active = current === tabValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(tabValue)}
      className={cn(
        "flex-1 rounded-2xl px-3 py-2 text-sm transition",
        active ? "bg-primary/20 border border-primary/25 text-text" : "text-muted hover:bg-white/5 border border-transparent"
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value: current, tabValue, children, className }) {
  if (current !== tabValue) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
