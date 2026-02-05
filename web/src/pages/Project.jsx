import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { useProject } from "../hooks/useProject";
import { useProjectTasks } from "../hooks/useProjectTasks";
import { useTask } from "../hooks/useTask";
import { useUpdateTaskStatus } from "../hooks/useUpdateTaskStatus";

import { ProjectHeader } from "../components/projects/ProjectHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { TaskDrawer } from "../components/projects/TaskDrawer";
import { KanbanBoard } from "../components/kanban/KanbanBoard";

import { SprintBoard } from "../components/sprints/SprintBoard";
import { AiProjectPanel } from "../components/projects/AiProjectPanel";

// --- CORREÇÃO 1: Extração Robusta de Dados ---
function extractProject(res) {
  // Tenta pegar project dentro de data.project ou data.data.project
  return res?.data?.project || res?.project || res?.data || null;
}

function extractTasks(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data.tasks)) return res.data.tasks;
  if (res.tasks && Array.isArray(res.tasks)) return res.tasks;
  return [];
}
// ---------------------------------------------

export function Project() {
  const nav = useNavigate();
  const { workspaceId, projectId, taskId } = useParams();

  const [tab, setTab] = useState("kanban");

  const projectQ = useProject(workspaceId, projectId);
  const tasksQ = useProjectTasks(workspaceId, projectId);
  const taskQ = useTask(workspaceId, taskId);
  const updateStatus = useUpdateTaskStatus(workspaceId, projectId);

  function openTask(tId) {
    nav(`/app/w/${workspaceId}/p/${projectId}/t/${tId}`);
  }

  function closeDrawer() {
    nav(`/app/w/${workspaceId}/p/${projectId}`, { replace: true });
  }

  function moveTask({ taskId, status }) {
    updateStatus.mutate({ taskId, status });
  }

  // Uso das funções corrigidas
  const project = useMemo(() => extractProject(projectQ.data), [projectQ.data]);
  const tasks = useMemo(() => extractTasks(tasksQ.data), [tasksQ.data]);
  
  const openDrawer = Boolean(taskId);

  // Debug: Se quiser ver no console o que está chegando
  console.log("Projeto Carregado:", project);

  return (
    <div className="space-y-4">
      {projectQ.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
      ) : (
        <ProjectHeader project={project} />
      )}

      {/* --- CORREÇÃO 2: Tabs usando 'value' correto --- */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="ai">IA Copilot</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div 
            key={tab} 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }} 
            transition={{ duration: 0.15 }}
            className="mt-4"
          >
            
            <TabsContent value="kanban">
              <Card className="border-none bg-transparent shadow-none p-0">
                <CardContent className="p-0">
                  {tasksQ.isLoading ? <Skeleton className="h-72 w-full" /> : <KanbanBoard tasks={tasks} onOpenTask={openTask} onMoveTask={moveTask} />}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list">
              <Card>
                <CardHeader><CardTitle>Lista de Tarefas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {tasks.length > 0 ? (
                    tasks.map((t) => (
                      <div key={t.id} onClick={() => openTask(t.id)} className="p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer flex justify-between items-center transition">
                        <span className="font-medium text-text">{t.title}</span>
                        <Badge tone={t.status === 'done' ? 'success' : 'secondary'}>{t.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted">Nenhuma tarefa encontrada.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sprints">
              <SprintBoard workspaceId={workspaceId} projectId={projectId} />
            </TabsContent>

            <TabsContent value="ai">
              {project?.id ? (
                <AiProjectPanel workspaceId={workspaceId} project={project} />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-32 w-full" />
                  <p className="text-sm text-muted">Carregando dados do projeto para a IA...</p>
                </div>
              )}
            </TabsContent>

          </motion.div>
        </AnimatePresence>
      </Tabs>

      <TaskDrawer open={openDrawer} onClose={closeDrawer} taskQuery={taskQ} workspaceId={workspaceId} />
    </div>
  );
}