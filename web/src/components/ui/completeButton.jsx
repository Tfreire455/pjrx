import React from "react";
import { Button } from "./button";
import { fireConfetti } from "../../lib/confetti";
import { CheckCircle2 } from "lucide-react";

export function CompleteButton({ children = "Concluir", onComplete, disabled }) {
  async function run() {
    await onComplete?.();
    fireConfetti();
  }

  return (
    <Button variant="secondary" onClick={run} disabled={disabled}>
      <CheckCircle2 size={18} />
      {children}
    </Button>
  );
}
