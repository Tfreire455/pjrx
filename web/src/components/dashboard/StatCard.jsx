import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, Activity } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

// Mapeamento de ícones e cores
const toneMap = {
  primary: { icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  danger: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  secondary: { icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  neutral: { icon: Activity, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
};

export function StatCard({ title, value, hint, loading, tone = "neutral" }) {
  const style = toneMap[tone] || toneMap.neutral;
  const Icon = style.icon;

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-xl p-6 transition-all hover:bg-[#0a0a0a]/60 hover:border-white/10">
      {/* Glow Effect on Hover */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${style.bg} blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-16 bg-zinc-800" />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white tracking-tight"
              >
                {value}
              </motion.div>
            )}
          </div>
        </div>
        
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${style.border} ${style.bg}`}>
          <Icon size={20} className={style.color} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.color} border ${style.border}`}>
          {hint}
        </span>
      </div>
    </div>
  );
}