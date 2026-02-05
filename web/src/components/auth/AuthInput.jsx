import React from "react";

export function AuthInput({ label, error, ...props }) {
  return (
    <div>
      {label ? <div className="text-xs text-muted mb-1">{label}</div> : null}
      <input
        className="w-full h-11 rounded-2xl bg-white/3 border border-white/10 px-4 text-text outline-none
                   focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition"
        {...props}
      />
      {error ? <div className="text-xs text-danger mt-1">{String(error)}</div> : null}
    </div>
  );
}
