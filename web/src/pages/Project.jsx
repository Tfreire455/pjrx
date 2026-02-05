import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { useProject } from "../hooks/useProject";
import { useProjectTasks } from "../hooks/useProjectTasks";
import { useTask } from "../hooks/useTask";
import { useUpdateTaskStatus } from "../hooks/useUpdateTaskStatus";

import { ProjectHeader } from "../components/projects/ProjectHeader";
import { ProjectTabs } from "../components/projects/ProjectTabs";
import { TabsContent } from "../components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { TaskDrawer } from "../components/projects/TaskDrawer";
import { KanbanBoard } from "../components/kanban/KanbanBoard";

function parseData(q) {
  return q?.data?.data || q?.data || null;
}

export function Project() {
  const nav = useNavigate();
  const { workspaceId, projectId, taskId } = useParams(); // IDs da URL

  const [tab, setTab] = useState("kanban");

  const projectQ = useProject(workspaceId, projectId);
  const tasksQ = useProjectTasks(workspaceId, projectId);
  const taskQ = useTask(workspaceId, taskId);

  const updateStatus = useUpdateTaskStatus(workspaceId, projectId);

  // CORREÇÃO: Navegação absoluta incluindo /app
  function openTask(tId) {
    nav(`/app/w/${workspaceId}/p/${projectId}/t/${tId}`);
  }

  function closeDrawer() {
    nav(`/app/w/${workspaceId}/p/${projectId}`, { replace: true });
  }

  function moveTask({ taskId, status }) {
    updateStatus.mutate({ taskId, status });
  }

  useEffect(() => {
    if (projectQ.error) toast.error(projectQ.error.message);
    if (tasksQ.error) toast.error(tasksQ.error.message);
  }, [projectQ.error, tasksQ.error]);

  const project = parseData(projectQ);
  const tasks = (tasksQ.data?.data || tasksQ.data || []);
  const openDrawer = Boolean(taskId);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    return { total, done, blocked };
  }, [tasks]);

  return (
    <div className="space-y-4">
      {projectQ.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
      ) : (
        <ProjectHeader project={project} />
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Tarefas</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-text">{stats.total}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Done</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-text">{stats.done}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Blocked</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-text">{stats.blocked}</div></CardContent></Card>
      </div>

      <ProjectTabs tab={tab} setTab={setTab} />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          <TabsContent value={tab} tabValue="kanban">
            <Card>
              <CardHeader><CardTitle>Kanban</CardTitle></CardHeader>
              <CardContent>
                {tasksQ.isLoading ? <Skeleton className="h-72 w-full" /> : <KanbanBoard tasks={tasks} onOpenTask={openTask} onMoveTask={moveTask} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value={tab} tabValue="list">
            <Card>
              <CardHeader><CardTitle>Lista</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tasks.map((t) => (
                  <button key={t.id} className="w-full text-left rounded-2xl border border-white/10 bg-white/3 p-4 hover:bg-white/5 transition" onClick={() => openTask(t.id)}>
                    <div className="flex justify-between"><div className="font-semibold">{t.title}</div><Badge>{t.status}</Badge></div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Calendar e AI placeholders mantidos */}
        </motion.div>
      </AnimatePresence>

      <TaskDrawer open={openDrawer} onClose={closeDrawer} taskQuery={taskQ} workspaceId={workspaceId} />
    </div>
  );
}