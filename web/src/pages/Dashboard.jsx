import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Rocket, Plus, ChevronDown, Building2, FolderPlus, ArrowRight, LayoutGrid, Sparkles, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { useWorkspaces } from "../hooks/useWorkspaces";
// REMOVIDO: useCreateProject daqui, pois agora está dentro do modal
import { useProjects } from "../hooks/useProjects"; 
import { useAtRiskTasks } from "../hooks/useAtRiskTasks";
import { useNotifications } from "../hooks/useNotifications";
import { apiFetch } from "../lib/api";

import { StatCard } from "../components/dashboard/StatCard";
import { RiskList } from "../components/dashboard/RiskList";
import { ActivityList } from "../components/dashboard/ActivityList";
import { CreateProjectModal } from "../components/projects/CreateProjectModal"; 

import { Button } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty";

const scrollbarStyles = `
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 100px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
  ::-webkit-scrollbar-corner { background: transparent; }
`;

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

function ProjectCard({ p, onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="group cursor-pointer relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a]/40 p-6 transition-all duration-300 hover:border-violet-500/30 hover:bg-[#0a0a0a]/60 hover:shadow-2xl hover:shadow-violet-900/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex flex-col h-full">
         <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-violet-500 group-hover:border-violet-400 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-violet-500/40">
               <FolderPlus size={20} />
            </div>
            <div className="flex items-center gap-2">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">Active</span>
                <div className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 bg-white/5">
                   <ArrowRight size={14} className="text-white" />
                </div>
            </div>
         </div>
         <div className="mt-5">
            <h4 className="text-lg font-bold text-zinc-100 group-hover:text-white tracking-tight">{p.name}</h4>
            <p className="text-sm text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{p.description || "Projeto sem descrição definida."}</p>
         </div>
         <div className="mt-auto pt-6">
            <div className="flex items-center justify-between text-xs text-zinc-600 mb-2 font-mono">
                <span>PROGRESS</span>
                <span className="group-hover:text-violet-400 transition-colors">{p.stats?.progress || 0}%</span>
            </div>
            <div className="h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden">
               <div className="h-full bg-violet-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${p.stats?.progress || 0}%` }} />
            </div>
         </div>
      </div>
    </motion.div>
  );
}

function WorkspaceSelector({ workspaces, activeId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const activeWorkspace = workspaces.find(w => w.id === activeId);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative group min-w-[200px]" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-4 cursor-pointer select-none group/trigger">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white truncate max-w-[400px] transition-colors group-hover/trigger:text-violet-100">
          {activeWorkspace?.name || "Carregando..."}
        </h1>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-500 transition-all duration-300 ${isOpen ? 'bg-violet-500 text-white rotate-180 border-violet-400' : 'group-hover/trigger:bg-violet-500 group-hover/trigger:text-white group-hover/trigger:border-violet-400'}`}>
           <ChevronDown size={20} />
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-full left-0 mt-4 w-[320px] p-2 rounded-[1.5rem] border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-2xl shadow-2xl shadow-black/50 z-50 flex flex-col gap-1 max-h-[400px] overflow-hidden">
            <div className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.02] border-b border-white/5 mb-1">Selecionar Workspace</div>
            <div className="overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1 max-h-[300px]">
              {workspaces.map(w => (
                <div key={w.id} onClick={() => { onChange(w.id); setIsOpen(false); }} className={`group/item relative flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${w.id === activeId ? 'bg-violet-500/10 text-white border border-violet-500/20 shadow-[0_0_15px_-5px_rgba(124,58,237,0.3)]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100 border border-transparent'}`}>
                  <span className="font-medium truncate text-sm">{w.name}</span>
                  {w.id === activeId && <motion.div layoutId="check" className="text-violet-400"><Check size={16} /></motion.div>}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-white/5 mt-auto bg-[#0a0a0a]">
              <button onClick={() => { onChange('new'); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all text-sm font-medium w-full text-left group/btn">
                <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-white/5 border border-white/10 group-hover/btn:border-violet-500/30 group-hover/btn:bg-violet-500/10 group-hover/btn:text-violet-400 transition-colors"><Plus size={14} /></div>
                Criar novo workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

  const handleWorkspaceChange = (val) => {
    if (val === 'new') handleCreateWorkspace();
    else nav(`/app/w/${val}`);
  };

  const projects = extractData(projectsQ.data, "projects");
  const tasks = extractData(riskQ.data, "tasks");
  const notifs = extractData(notifQ.data, "items") || extractData(notifQ.data, "notifications");

  const metrics = { projects: projects.length, atRisk: tasks.length, activity: notifs.length };

  if (wsQ.isLoading || (!workspaceId && workspaces.length > 0)) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-zinc-500 animate-pulse">
        <LayoutGrid className="animate-spin text-violet-500" size={32}/> 
        <span className="text-sm font-medium tracking-widest uppercase">Inicializando Ambiente...</span>
      </div>
    );
  }

  if (!workspaceId && workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-zinc-300">
        <div className="relative">
            <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
            <EmptyState icon={Rocket} title="Bem-vindo ao Project OS" subtitle="Sua jornada de produtividade começa aqui." />
        </div>
        <div className="mt-8">
          <Button onClick={handleCreateWorkspace} disabled={isCreatingWs} className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all shadow-xl shadow-white/10">
            <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Workspace
          </Button>
        </div>
      </div>
    );
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } } };

  return (
    <>
    <style>{scrollbarStyles}</style>
    <div className="relative min-h-screen pb-20">
       <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030014]">
         <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-violet-900/10 to-transparent" />
         <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
       </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 max-w-[1600px] mx-auto px-6 sm:px-8 md:px-12 py-8">
        <motion.div variants={item} className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-violet-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-violet-500/30 text-white border border-white/10"><Building2 size={32} /></div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-[#030014] z-10" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-widest"><Sparkles size={10} /> Workspace Ativo</div>
              <WorkspaceSelector workspaces={workspaces} activeId={workspaceId} onChange={handleWorkspaceChange} />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={handleCreateWorkspace} disabled={isCreatingWs} className="h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"><Plus className="mr-2 h-4 w-4" /> Novo Workspace</Button>
            <Button size="sm" onClick={() => setProjectModalOpen(true)} className="h-10 px-6 bg-white text-black hover:bg-zinc-200 rounded-full font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105"><FolderPlus className="mr-2 h-4 w-4" /> Criar Projeto</Button>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
          <StatCard title="Projetos em Andamento" hint="Total" tone="primary" value={metrics.projects} loading={projectsQ.isLoading} />
          <StatCard title="Tarefas Críticas" hint="Risco Imediato" tone="danger" value={metrics.atRisk} loading={riskQ.isLoading} />
          <StatCard title="Eventos do Sistema" hint="Últimas 24h" tone="secondary" value={metrics.activity} loading={notifQ.isLoading} />
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           <div className="xl:col-span-2 space-y-6">
              <motion.div variants={item} className="flex items-center justify-between px-1">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2"><LayoutGrid size={20} className="text-violet-500" /> Visão Geral de Projetos</h3>
              </motion.div>
              {projects.length > 0 ? (
                <motion.div variants={container} className="grid gap-5 md:grid-cols-2">
                  {projects.map(p => (
                    <motion.div key={p.id} variants={item}><ProjectCard p={p} onClick={() => nav(`/app/w/${workspaceId}/p/${p.id}`)} /></motion.div>
                  ))}
                </motion.div>
              ) : (
                !projectsQ.isLoading && (
                  <motion.div variants={item} className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02] text-zinc-500 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => setProjectModalOpen(true)}>
                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4"><FolderPlus size={32} className="opacity-50" /></div>
                    <p className="font-medium">Nenhum projeto ativo.</p>
                    <span className="text-sm text-violet-400 mt-2 hover:underline">Clique para criar o primeiro</span>
                  </motion.div>
                )
              )}
           </div>
           <motion.div variants={container} className="space-y-6">
              <motion.div variants={item}><RiskList loading={riskQ.isLoading} tasks={tasks} /></motion.div>
              <motion.div variants={item}><ActivityList loading={notifQ.isLoading} items={notifs} /></motion.div>
           </motion.div>
        </div>
      </motion.div>

      {/* CORREÇÃO APLICADA: Passamos workspaceId ao invés de createProject */}
      <CreateProjectModal 
        open={isProjectModalOpen} 
        onClose={() => setProjectModalOpen(false)} 
        workspaceId={workspaceId} 
      />
    </div>
    </>
  );
}