import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

// Função Helper Robusta
function extractTasks(res) {
  if (!res) return [];
  if (res.data && Array.isArray(res.data.tasks)) return res.data.tasks;
  if (res.tasks && Array.isArray(res.tasks)) return res.tasks;
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
}

export function Project() {
  const nav = useNavigate();
  const { workspaceId, projectId, taskId } = useParams();
  const [tab, setTab] = useState("kanban");

  const projectQ = useProject(workspaceId, projectId);
  const tasksQ = useProjectTasks(workspaceId, projectId);
  const taskQ = useTask(workspaceId, taskId);
  const updateStatus = useUpdateTaskStatus(workspaceId, projectId);

  const project = projectQ.data?.data?.project || projectQ.data?.project || null;
  const tasks = useMemo(() => extractTasks(tasksQ.data), [tasksQ.data]);

  function openTask(tId) { nav(`/app/w/${workspaceId}/p/${projectId}/t/${tId}`); }
  function closeDrawer() { nav(`/app/w/${workspaceId}/p/${projectId}`, { replace: true }); }
  function moveTask({ taskId, status }) { updateStatus.mutate({ taskId, status }); }

  return (
    <div className="space-y-4">
      {projectQ.isLoading ? <Skeleton className="h-12 w-full"/> : <ProjectHeader project={project} />}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="ai">IA Copilot</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mt-4">
            
            <TabsContent value="kanban">
              <div className="h-[calc(100vh-280px)] min-h-[500px]">
                {tasksQ.isLoading ? <Skeleton className="h-full w-full"/> : 
                 <KanbanBoard tasks={tasks} onOpenTask={openTask} onMoveTask={moveTask} />}
              </div>
            </TabsContent>

            <TabsContent value="list">
              <Card>
                <CardHeader><CardTitle>Lista de Tarefas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {tasks.length > 0 ? tasks.map(t => (
                    <div key={t.id} onClick={() => openTask(t.id)} className="p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer flex justify-between">
                      <span>{t.title}</span><Badge>{t.status}</Badge>
                    </div>
                  )) : <div className="text-muted text-sm">Sem tarefas.</div>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sprints">
              <SprintBoard workspaceId={workspaceId} projectId={projectId} />
            </TabsContent>

            <TabsContent value="ai">
              {project ? <AiProjectPanel workspaceId={workspaceId} project={project} /> : <Skeleton className="h-48"/>}
            </TabsContent>

          </motion.div>
        </AnimatePresence>
      </Tabs>

      <TaskDrawer open={Boolean(taskId)} onClose={closeDrawer} taskQuery={taskQ} workspaceId={workspaceId} />
    </div>
  );
}