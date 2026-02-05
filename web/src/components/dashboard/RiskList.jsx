import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

function Item({ t, index }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4 transition-all hover:bg-zinc-900/60 hover:border-red-500/20"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-200 group-hover:text-white transition-colors">
            {t.title}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400">
            <Clock size={12} />
            <span>Vence: {new Date(t.dueAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
         <ArrowRight size={16} className="text-zinc-400" />
      </div>
    </motion.div>
  );
}

export function RiskList({ loading, tasks }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#0a0a0a]/20 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Tarefas Críticas</h3>
        <span className="flex h-6 items-center justify-center rounded-full bg-red-500/10 px-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
            Prioridade Alta
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl bg-zinc-800/50" />
          ))
        ) : tasks?.length ? (
          <AnimatePresence mode="popLayout">
            {tasks.slice(0, 5).map((t, i) => <Item key={t.id} t={t} index={i} />)}
          </AnimatePresence>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
             <div className="mb-2 text-2xl">🎉</div>
             <p className="text-sm text-zinc-500">Tudo sob controle.</p>
          </div>
        )}
      </div>
    </div>
  );
}