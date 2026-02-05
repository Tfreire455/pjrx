import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Rocket, Plus, ChevronDown, Building2, FolderPlus, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useWorkspaces } from "../hooks/useWorkspaces";
import { useProjects, useCreateProject } from "../hooks/useProjects"; 
import { useAtRiskTasks } from "../hooks/useAtRiskTasks";
import { useNotifications } from "../hooks/useNotifications";
import { apiFetch } from "../lib/api";

import { StatCard } from "../components/dashboard/StatCard";
import { RiskList } from "../components/dashboard/RiskList";
import { ActivityList } from "../components/dashboard/ActivityList";
import { CreateProjectModal } from "../components/projects/CreateProjectModal"; 

import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/empty";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

// Função para extrair dados com segurança (Resolve o problema de não aparecer)
function extractData(res, key) {
  if (!res) return [];
  // Se a resposta for direta [..]
  if (Array.isArray(res)) return res;
  
  // Se for { data: { projects: [...] } } (Padrão do seu backend)
  if (res.data && res.data[key] && Array.isArray(res.data[key])) {
    return res.data[key];
  }
  
  // Se for { projects: [...] }
  if (res[key] && Array.isArray(res[key])) {
    return res[key];
  }

  // Fallbacks genéricos
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
}

// Normaliza workspaces (que tem estrutura variada as vezes)
function normalizeWorkspaces(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.workspaces) return res.workspaces;
  if (res.data) return Array.isArray(res.data) ? res.data : [];
  return [];
}

export function Dashboard() {
  const { workspaceId } = useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  
  const wsQ = useWorkspaces();
  const workspaces = useMemo(() => normalizeWorkspaces(wsQ.data), [wsQ.data]);
  
  const [isCreatingWs, setCreatingWs] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);

  // Redireciona para o primeiro workspace se estiver na raiz
  useEffect(() => {
    if (!workspaceId && !wsQ.isLoading && workspaces.length > 0) {
      nav(`/app/w/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaceId, wsQ.isLoading, workspaces, nav]);

  // Hooks de dados
  const projectsQ = useProjects(workspaceId);
  const createProject = useCreateProject(workspaceId);
  const riskQ = useAtRiskTasks(workspaceId);
  const notifQ = useNotifications(workspaceId, 10);

  useEffect(() => { if (wsQ.error) toast.error(wsQ.error.message); }, [wsQ.error]);

  async function handleCreateWorkspace() {
    let name = window.prompt("Nome do novo Workspace:");
    if (name === null) return;
    if (!name.trim()) name = `Workspace #${Math.floor(Math.random() * 10000)}`;

    setCreatingWs(true);
    try {
      const res = await apiFetch("/workspaces", { method: "POST", body: { name } });
      toast.success(`Workspace "${name}" criado!`);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      
      const newWs = res.workspace || res.data?.workspace;
      if (newWs?.id) {
        nav(`/app/w/${newWs.id}`);
      }
    } catch (e) {
      toast.error(e.message || "Erro ao criar workspace");
    } finally {
      setCreatingWs(false);
    }
  }

  // Extração segura dos dados usando a função corrigida
  const projects = extractData(projectsQ.data, "projects");
  const tasks = extractData(riskQ.data, "tasks");
  const notifs = extractData(notifQ.data, "items") || extractData(notifQ.data, "notifications"); // Tenta ambos

  const metrics = { 
    projects: projects.length, 
    atRisk: tasks.length, 
    activity: notifs.length 
  };

  if (wsQ.isLoading || (!workspaceId && workspaces.length > 0)) {
    return <div className="p-8 text-muted animate-pulse">Carregando ambiente...</div>;
  }

  if (!workspaceId && workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState icon={Rocket} title="Bem-vindo ao Project OS" subtitle="Crie seu primeiro workspace para começar." />
        <div className="mt-6">
          <Button onClick={handleCreateWorkspace} disabled={isCreatingWs}>
            <Plus className="mr-2 h-4 w-4" /> Criar Workspace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
           <Button variant="outline" size="sm" onClick={handleCreateWorkspace} disabled={isCreatingWs}>
            <Plus className="mr-2 h-3 w-3" /> Novo Workspace
          </Button>
          <Button size="sm" onClick={() => setProjectModalOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" /> Novo Projeto
          </Button>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Projetos" hint="ativos" tone="primary" value={metrics.projects} loading={projectsQ.isLoading} />
        <StatCard title="Tarefas em risco" hint="< 24h" tone="danger" value={metrics.atRisk} loading={riskQ.isLoading} />
        <StatCard title="Atividade" hint="últimas" tone="secondary" value={metrics.activity} loading={notifQ.isLoading} />
      </div>

      {/* Lista de Projetos (Grid de Cards) */}
      {projects.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Meus Projetos</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <Card 
                key={p.id} 
                className="hover:border-primary/50 transition cursor-pointer group bg-surface"
                onClick={() => nav(`/app/w/${workspaceId}/p/${p.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-text group-hover:text-primary transition truncate">{p.name}</div>
                    <div className="text-xs text-muted truncate max-w-[200px] mt-1">{p.description || "Sem descrição"}</div>
                  </div>
                  <ArrowRight size={16} className="text-muted opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        !projectsQ.isLoading && (
          <div className="text-center p-10 border border-dashed border-white/10 rounded-xl text-muted">
            Nenhum projeto encontrado. Crie o primeiro!
          </div>
        )
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RiskList loading={riskQ.isLoading} tasks={tasks} />
        <ActivityList loading={notifQ.isLoading} items={notifs} />
      </div>

      <CreateProjectModal 
        open={isProjectModalOpen} 
        onClose={() => setProjectModalOpen(false)} 
        createProject={createProject} 
      />
    </div>
  );
}