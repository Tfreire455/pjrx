import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Bell, Layers, Settings2, Sparkles } from "lucide-react";

// Estilos injetados para scrollbar customizada (Fina e Minimalista)
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

function Item({ to, icon: Icon, label, disabled }) {
  if (disabled) {
    return (
      <div className="group flex items-center gap-3 rounded-xl px-4 py-3 border border-transparent text-zinc-600 cursor-not-allowed opacity-50 select-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 opacity-50">
           <Icon size={16} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 overflow-hidden ${
          isActive
            ? "text-white"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Fundo Ativo com Glow */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Container do Ícone */}
          <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-300 ${isActive ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10'}`}>
            <Icon size={16} />
          </div>

          {/* Texto */}
          <span className="relative z-10 text-sm font-medium tracking-wide">{label}</span>
          
          {/* Indicador Ativo (Ponto) */}
          {isActive && (
             <motion.div 
               layoutId="active-dot"
               className="absolute right-3 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
             />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { workspaceId } = useParams();
  const hasWorkspace = Boolean(workspaceId);

  return (
    <>
      <style>{scrollbarStyles}</style>
      <aside className="h-full w-full flex flex-col gap-6 overflow-hidden">
        
        {/* Container de Navegação com Scroll Customizado */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">
          
          {/* Grupo Principal */}
          <div className="flex flex-col gap-1">
             <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500/80">
              Navegação
            </div>
            
            <nav className="space-y-1">
              <Item 
                to={hasWorkspace ? `/app/w/${workspaceId}` : "/app"} 
                icon={LayoutDashboard} 
                label="Dashboard" 
              />
              
              <Item 
                to={`/app/w/${workspaceId}/notifications`} 
                icon={Bell} 
                label="Notificações" 
                disabled={!hasWorkspace} 
              />
            </nav>
          </div>

          {/* Grupo de Configuração */}
          <div className="flex flex-col gap-1">
             <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500/80">
              Configuração
            </div>
            
            <nav className="space-y-1">
              <Item 
                to={`/app/w/${workspaceId}/templates/checklists`} 
                icon={Layers} 
                label="Templates" 
                disabled={!hasWorkspace} 
              />
              
              <Item 
                to={`/app/w/${workspaceId}/settings`} 
                icon={Settings2} 
                label="Settings" 
                disabled={!hasWorkspace} 
              />
            </nav>
          </div>
        </div>

        {/* Card de Dica "Pro" (Substituindo o texto simples) */}
        <div className="px-2 pb-2 mt-auto">
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4 group">
              <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex items-start gap-3">
                 <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
                    <Sparkles size={12} />
                 </div>
                 <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-200 mb-1">Dica Pro</div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                      Use deep links em tarefas para compartilhar contexto:
                    </p>
                    <code className="block rounded bg-[#0a0a0a]/50 border border-white/5 px-2 py-1.5 font-mono text-[9px] text-zinc-500 break-all select-all hover:text-zinc-300 hover:border-white/10 transition-colors cursor-text">
                      /w/{workspaceId || ":id"}/p/:id/t/:id
                    </code>
                 </div>
              </div>
            </div>
        </div>
      </aside>
    </>
  );
}