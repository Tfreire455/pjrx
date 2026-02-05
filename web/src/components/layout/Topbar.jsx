import React from "react";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "../ui/button";

export function Topbar({ onLogout }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/25 flex items-center justify-center">
          <Sparkles size={18} className="text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">PRJX</div>
          <div className="text-xs text-muted">Seu Project OS com IA + WhatsApp</div>
        </div>
      </div>

      <Button variant="ghost" onClick={onLogout}>
        <LogOut size={16} className="mr-2" />
        Sair
      </Button>
    </div>
  );
}