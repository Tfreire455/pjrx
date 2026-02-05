import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Rocket, Plus, ChevronDown, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useWorkspaces } from "../hooks/useWorkspaces";
import { useProjects } from "../hooks/useProjects";
import { useAtRiskTasks } from "../hooks/useAtRiskTasks";
import { useNotifications } from "../hooks/useNotifications";
import { apiFetch } from "../lib/api";

import { StatCard } from "../components/dashboard/StatCard";
import { RiskList } from "../components/dashboard/RiskList";
import { ActivityList } from "../components/dashboard/ActivityList";

import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/empty";
import { Button } from "../components/ui/button";

function normalizeWorkspaces(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.workspaces) return res.workspaces;
  if (res.data) return Array.isArray(res.data) ? res.data : [];
  return [];
}

export function Dashboard() {
  const { workspaceId } = useParams(); // ID vindo da URL (/app/w/:id)
  const nav = useNavigate();
  const queryClient = useQueryClient();
  
  const wsQ = useWorkspaces();
  const workspaces = useMemo(() => normalizeWorkspaces(wsQ.data), [wsQ.data]);
  
  const [isCreating, setCreating] = useState(false);

  // Lógica de Redirecionamento Automático:
  // Se estamos na raiz (/app) e temos workspaces, vai para o primeiro.
  useEffect(() => {
    if (!workspaceId && !wsQ.isLoading && workspaces.length > 0) {
      nav(`/app/w/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaceId, wsQ.isLoading, workspaces, nav]);

  // Hooks de dados (só rodam se tivermos um ID na URL)
  const projectsQ = useProjects(workspaceId);
  const riskQ = useAtRiskTasks(workspaceId);
  const notifQ = useNotifications(workspaceId, 10);

  useEffect(() => { if (wsQ.error) toast.error(wsQ.error.message); }, [wsQ.error]);

  async function handleCreateWorkspace() {
    let name = window.prompt("Nome do novo Workspace:");
    if (name === null) return;
    if (!name.trim()) name = `Workspace #${Math.floor(Math.random() * 10000)}`;

    setCreating(true);
    try {
      const res = await apiFetch("/workspaces", { method: "POST", body: { name } });
      toast.success(`Workspace "${name}" criado!`);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      
      const newWs = res.workspace || res.data?.workspace;
      if (newWs?.id) {
        nav(`/app/w/${newWs.id}`); // Navega para o novo workspace
      }
    } catch (e) {
      toast.error(e.message || "Erro ao criar workspace");
    } finally {
      setCreating(false);
    }
  }

  // Loading State
  if (wsQ.isLoading || (!workspaceId && workspaces.length > 0)) {
    return <div className="p-8 text-muted animate-pulse">Carregando ambiente...</div>;
  }

  // Estado Vazio (Sem workspaces criados)
  if (!workspaceId && workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={Rocket}
          title="Bem-vindo ao Project OS"
          subtitle="Crie seu primeiro workspace para começar."
        />
        <div className="mt-6">
          <Button onClick={handleCreateWorkspace} disabled={isCreating}>
            <Plus className="mr-2 h-4 w-4" /> Criar Workspace
          </Button>
        </div>
      </div>
    );
  }

  // Dados para widgets
  const projects = Array.isArray(projectsQ.data) ? projectsQ.data : (projectsQ.data?.projects || []);
  const tasks = Array.isArray(riskQ.data) ? riskQ.data : (riskQ.data?.tasks || []);
  const notifs = Array.isArray(notifQ.data) ? notifQ.data : (notifQ.data?.items || []);

  const metrics = { projects: projects.length, atRisk: tasks.length, activity: notifs.length };

  return (
    <div className="space-y-6">
      {/* Header com Dropdown de Workspace */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 size={20} />
          </div>
          
          <div>
            <div className="text-xs text-muted">Workspace atual</div>
            <div className="relative group">
              <select
                className="appearance-none bg-transparent font-semibold text-lg text-text pr-8 focus:outline-none cursor-pointer"
                value={workspaceId || ""}
                onChange={(e) => nav(`/app/w/${e.target.value}`)}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id} className="text-black bg-white">{w.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1.5 h-4 w-4 text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleCreateWorkspace} disabled={isCreating}>
            <Plus className="mr-2 h-3 w-3" /> Novo Workspace
          </Button>
          <Badge tone="secondary">Beta</Badge>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Projetos" hint="ativos" tone="primary" value={metrics.projects} loading={projectsQ.isLoading} />
        <StatCard title="Tarefas em risco" hint="< 24h" tone="danger" value={metrics.atRisk} loading={riskQ.isLoading} />
        <StatCard title="Atividade" hint="últimas" tone="secondary" value={metrics.activity} loading={notifQ.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RiskList loading={riskQ.isLoading} tasks={tasks} />
        <ActivityList loading={notifQ.isLoading} items={notifs} />
      </div>
    </div>
  );
}