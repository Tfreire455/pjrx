import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

import { useProject } from "../hooks/useProject";
import { useProjectTasks } from "../hooks/useProjectTasks";
import { useTask } from "../hooks/useTask";
import { useUpdateTaskStatus } from "../hooks/useUpdateTaskStatus";

import { ProjectHeader } from "../components/projects/ProjectHeader";
import { ProjectTabs } from "../components/projects/ProjectTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { TaskDrawer } from "../components/projects/TaskDrawer";
import { KanbanBoard } from "../components/kanban/KanbanBoard";

import { SprintBoard } from "../components/sprints/SprintBoard";
import { AiProjectPanel } from "../components/projects/AiProjectPanel";

// Função auxiliar para extrair o array de tarefas com segurança
function extractTasks(res) {
  if (!res) return [];
  
  // Caminho 1: data.data.tasks (Padrão mais comum do seu backend)
  if (res.data && res.data.tasks && Array.isArray(res.data.tasks)) {
    return res.data.tasks;
  }

  // Caminho 2: data.tasks (Se o apiFetch já tiver desembrulhado um nível)
  if (res.tasks && Array.isArray(res.tasks)) {
    return res.tasks;
  }

  // Caminho 3: O próprio res é um array
  if (Array.isArray(res)) return res;

  // Fallback
  return [];
}

function parseData(q) {
  return q?.data?.data || q?.data || null; // Para o objeto do projeto
}

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

  const project = parseData(projectQ);
  
  // CORREÇÃO AQUI: Uso da função segura para extrair o array
  const tasks = useMemo(() => extractTasks(tasksQ.data), [tasksQ.data]);
  
  const openDrawer = Boolean(taskId);

  return (
    <div className="space-y-4">
      {projectQ.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
      ) : (
        <ProjectHeader project={project} />
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger tabValue="kanban">Kanban</TabsTrigger>
          <TabsTrigger tabValue="list">Lista</TabsTrigger>
          <TabsTrigger tabValue="sprints">Sprints</TabsTrigger>
          <TabsTrigger tabValue="ai">IA Copilot</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="mt-4">
            
            <TabsContent value={tab} tabValue="kanban">
              <Card>
                <CardHeader><CardTitle>Quadro</CardTitle></CardHeader>
                <CardContent>
                  {tasksQ.isLoading ? <Skeleton className="h-72 w-full" /> : <KanbanBoard tasks={tasks} onOpenTask={openTask} onMoveTask={moveTask} />}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value={tab} tabValue="list">
              <Card>
                <CardHeader><CardTitle>Lista de Tarefas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {tasks.length > 0 ? (
                    tasks.map((t) => (
                      <div key={t.id} onClick={() => openTask(t.id)} className="p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer flex justify-between items-center">
                        <span>{t.title}</span>
                        <Badge>{t.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted">Nenhuma tarefa encontrada.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value={tab} tabValue="sprints">
              <SprintBoard workspaceId={workspaceId} projectId={projectId} />
            </TabsContent>

            <TabsContent value={tab} tabValue="ai">
              {project ? (
                <AiProjectPanel workspaceId={workspaceId} project={project} />
              ) : (
                <Skeleton className="h-48 w-full" />
              )}
            </TabsContent>

          </motion.div>
        </AnimatePresence>
      </Tabs>

      <TaskDrawer open={openDrawer} onClose={closeDrawer} taskQuery={taskQ} workspaceId={workspaceId} />
    </div>
  );
}