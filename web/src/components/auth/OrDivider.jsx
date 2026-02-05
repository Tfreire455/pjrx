import React from "react";

export function OrDivider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <div className="text-xs text-muted">ou</div>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}
