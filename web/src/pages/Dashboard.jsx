import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Rocket, Plus, ChevronDown, Building2, FolderPlus, ArrowRight, LayoutGrid } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { useWorkspaces } from "../hooks/useWorkspaces";
import { useProjects, useCreateProject } from "../hooks/useProjects"; 
import { useAtRiskTasks } from "../hooks/useAtRiskTasks";
import { useNotifications } from "../hooks/useNotifications";
import { apiFetch } from "../lib/api";

import { StatCard } from "../components/dashboard/StatCard";
import { RiskList } from "../components/dashboard/RiskList";
import { ActivityList } from "../components/dashboard/ActivityList";
import { CreateProjectModal } from "../components/projects/CreateProjectModal"; 

import { Button } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty";

// --- HELPERS (Preservados) ---

function extractData(res, key) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && res.data[key] && Array.isArray(res.data[key])) return res.data[key];
  if (res[key] && Array.isArray(res[key])) return res[key];
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
}

function normalizeWorkspaces(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.workspaces) return res.workspaces;
  if (res.data) return Array.isArray(res.data) ? res.data : [];
  return [];
}

// --- PROJECT CARD COMPONENT ---

function ProjectCard({ p, onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a]/60 p-6 transition-colors hover:border-violet-500/30 hover:bg-[#0a0a0a]/80"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col h-full">
         <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
               <FolderPlus size={20} />
            </div>
            <div className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-4">
               <ArrowRight size={14} className="text-zinc-300" />
            </div>
         </div>
         
         <div className="mt-4">
            <h4 className="text-lg font-semibold text-zinc-100 group-hover:text-white">{p.name}</h4>
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {p.description || "Sem descrição definida."}
            </p>
         </div>

         <div className="mt-auto pt-6 flex items-center gap-2">
            <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
               <div className="h-full bg-violet-500 w-[0%] group-hover:w-[45%] transition-all duration-1000 ease-out" />
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">ACTIVE</span>
         </div>
      </div>
    </motion.div>
  );
}

// --- MAIN DASHBOARD ---

export function Dashboard() {
  const { workspaceId } = useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  
  const wsQ = useWorkspaces();
  const workspaces = useMemo(() => normalizeWorkspaces(wsQ.data), [wsQ.data]);
  
  const [isCreatingWs, setCreatingWs] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId && !wsQ.isLoading && workspaces.length > 0) {
      nav(`/app/w/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaceId, wsQ.isLoading, workspaces, nav]);

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
      if (newWs?.id) nav(`/app/w/${newWs.id}`);
    } catch (e) {
      toast.error(e.message || "Erro ao criar workspace");
    } finally {
      setCreatingWs(false);
    }
  }

  const projects = extractData(projectsQ.data, "projects");
  const tasks = extractData(riskQ.data, "tasks");
  const notifs = extractData(notifQ.data, "items") || extractData(notifQ.data, "notifications");

  const metrics = { 
    projects: projects.length, 
    atRisk: tasks.length, 
    activity: notifs.length 
  };

  if (wsQ.isLoading || (!workspaceId && workspaces.length > 0)) {
    return <div className="p-8 text-zinc-500 animate-pulse flex items-center gap-2"><LayoutGrid className="animate-spin" size={16}/> Carregando ambiente...</div>;
  }

  if (!workspaceId && workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-300">
        <EmptyState icon={Rocket} title="Bem-vindo ao Project OS" subtitle="Comece criando seu primeiro workspace." />
        <div className="mt-6">
          <Button onClick={handleCreateWorkspace} disabled={isCreatingWs} className="bg-white text-black hover:bg-zinc-200">
            <Plus className="mr-2 h-4 w-4" /> Criar Workspace
          </Button>
        </div>
      </div>
    );
  }

  // Animation Variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen pb-20">
       {/* Background Subtle Noise/Gradient */}
       <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030014]">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/10 to-transparent" />
         <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
       </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 max-w-[1600px] mx-auto"
      >
        {/* Header Section */}
        <motion.div variants={item} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 text-white">
                <Building2 size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#030014]" />
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Workspace</div>
              
              <div className="relative group">
                 {/* Custom Select Wrapper for Style */}
                <select
                  className="appearance-none bg-transparent font-bold text-2xl text-white pr-8 focus:outline-none cursor-pointer relative z-10 w-full"
                  value={workspaceId || ""}
                  onChange={(e) => nav(`/app/w/${e.target.value}`)}
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id} className="text-black bg-white">{w.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none group-hover:text-violet-400 transition-colors" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={handleCreateWorkspace} disabled={isCreatingWs} className="text-zinc-400 hover:text-white hover:bg-white/5">
              <Plus className="mr-2 h-4 w-4" /> Workspace
            </Button>
            <Button size="sm" onClick={() => setProjectModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
              <FolderPlus className="mr-2 h-4 w-4" /> Novo Projeto
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
          <StatCard title="Projetos Ativos" hint="Total" tone="primary" value={metrics.projects} loading={projectsQ.isLoading} />
          <StatCard title="Tarefas Críticas" hint="Risco Imediato" tone="danger" value={metrics.atRisk} loading={riskQ.isLoading} />
          <StatCard title="Atividade Recente" hint="Últimas 24h" tone="secondary" value={metrics.activity} loading={notifQ.isLoading} />
        </motion.div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left Column: Projects */}
           <div className="lg:col-span-2 space-y-6">
              <motion.div variants={item} className="flex items-center justify-between">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <LayoutGrid size={18} className="text-violet-400" />
                    Meus Projetos
                 </h3>
                 <span className="text-xs text-zinc-500">{projects.length} projetos encontrados</span>
              </motion.div>

              {projects.length > 0 ? (
                <motion.div variants={container} className="grid gap-4 md:grid-cols-2">
                  {projects.map(p => (
                    <motion.div key={p.id} variants={item}>
                       <ProjectCard p={p} onClick={() => nav(`/app/w/${workspaceId}/p/${p.id}`)} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                !projectsQ.isLoading && (
                  <motion.div variants={item} className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-white/5 text-zinc-500">
                    <FolderPlus size={32} className="mb-4 opacity-50" />
                    <p>Nenhum projeto encontrado.</p>
                    <Button variant="link" onClick={() => setProjectModalOpen(true)} className="text-violet-400 mt-2">Criar o primeiro agora</Button>
                  </motion.div>
                )
              )}
           </div>

           {/* Right Column: Widgets */}
           <motion.div variants={container} className="space-y-6">
              <motion.div variants={item}>
                <RiskList loading={riskQ.isLoading} tasks={tasks} />
              </motion.div>
              <motion.div variants={item}>
                <ActivityList loading={notifQ.isLoading} items={notifs} />
              </motion.div>
           </motion.div>
        </div>
      </motion.div>

      <CreateProjectModal 
        open={isProjectModalOpen} 
        onClose={() => setProjectModalOpen(false)} 
        createProject={createProject} 
      />
    </div>
  );
}