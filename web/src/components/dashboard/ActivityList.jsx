import React from "react";
import { motion } from "framer-motion";
import { Bell, FileText, CheckCircle2, Bot, Layers } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

function getIcon(type) {
  switch(type) {
    case 'ai': return Bot;
    case 'task': return CheckCircle2;
    case 'project': return Layers;
    default: return FileText;
  }
}

function getTypeStyle(type) {
  switch (type) {
    case "task": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "project": return "text-violet-400 bg-violet-500/10 border-violet-500/20";
    case "sprint": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "ai": return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
    default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  }
}

export function ActivityList({ loading, items }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#0a0a0a]/20 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Timeline</h3>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Bell size={12} /> Em tempo real
        </span>
      </div>

      <div className="relative space-y-4 pl-2">
        {/* Linha vertical conectora */}
        <div className="absolute left-[19px] top-2 bottom-4 w-[1px] bg-white/5" />

        {loading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <Skeleton className="h-12 w-full rounded-xl" />
             </div>
           ))
        ) : items?.length ? (
          items.slice(0, 6).map((n, i) => {
            const Icon = getIcon(n.type);
            const style = getTypeStyle(n.type);
            
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex gap-4 group"
              >
                <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${style} backdrop-blur-md`}>
                  <Icon size={14} />
                </div>
                
                <div className="flex-1 pb-1">
                   <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{n.type}</span>
                   </div>
                   <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 group-hover:text-zinc-400 transition-colors">
                     {n.body}
                   </p>
                   <span className="text-[10px] text-zinc-700 mt-1 block">
                     {new Date(n.createdAt).toLocaleString()}
                   </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-sm text-zinc-500 pl-4 py-4">Sem atividade recente.</div>
        )}
      </div>
    </div>
  );
}