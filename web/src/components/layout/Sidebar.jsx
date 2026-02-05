import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { LayoutDashboard, Bell, Layers, Settings2 } from "lucide-react";

function Item({ to, icon: Icon, label, disabled }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-3 py-2 border border-transparent text-muted/50 cursor-not-allowed">
        <div className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center opacity-50">
          <Icon size={18} />
        </div>
        <div className="text-sm font-medium">{label}</div>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-3 py-2 border transition",
          isActive
            ? "bg-primary/15 border-primary/25 text-text"
            : "bg-white/0 border-transparent text-muted hover:bg-white/5 hover:text-text"
        ].join(" ")
      }
    >
      <div className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </NavLink>
  );
}

export function Sidebar() {
  const { workspaceId } = useParams();

  // Se não tiver workspaceId (ex: carregando ou na raiz /app),
  // desabilita os links que dependem dele.
  const hasWorkspace = Boolean(workspaceId);

  return (
    <aside className="h-full w-full">
      <div className="rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-xl p-3 shadow-soft">
        <div className="px-2 py-2 text-xs text-muted">Navegação</div>

        <div className="space-y-1">
          <Item 
            to={hasWorkspace ? `/app/w/${workspaceId}` : "/app"} 
            icon={LayoutDashboard} 
            label="Dashboard" 
            // Dashboard sempre ativo, pois /app redireciona
          />
          
          <Item 
            to={`/app/w/${workspaceId}/notifications`} 
            icon={Bell} 
            label="Notificações" 
            disabled={!hasWorkspace} 
          />
          
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
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/3 p-3 text-xs text-muted">
          Dica: use deep links em tarefas:
          <div className="mt-1 text-text/90 break-all font-mono text-[10px]">
            /w/{workspaceId || ":id"}/p/:id/t/:id
          </div>
        </div>
      </div>
    </aside>
  );
}