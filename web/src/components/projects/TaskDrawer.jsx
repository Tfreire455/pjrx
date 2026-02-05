import React, { useMemo, useState } from "react";
import { Drawer } from "../../components/ui/drawer"; // Ajuste o caminho se necessário
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { toast } from "sonner";

import { useChecklist } from "../../hooks/useChecklist";
import { useToggleChecklistItem } from "../../hooks/useToggleChecklistItem";
import { useComments } from "../../hooks/useComments";
import { useCreateComment } from "../../hooks/useCreateComment";
import { useAttachments } from "../../hooks/useAttachments";
import { useDependencies } from "../../hooks/useDependencies";
import { useAiTaskPlan } from "../../hooks/useAiTaskPlan";

// Assumindo que os painéis estão na pasta 'panels' relativa a este componente
import { ChecklistPanel } from "../task/ChecklistPanel";
import { CommentsPanel } from "../task/CommentsPanel";
import { AttachmentsPanel } from "../task/AttachmentsPanel";
import { DependenciesPanel } from "../task/DependenciesPanel";
import { AiPanel } from "../task/AiPanel";

export function TaskDrawer({ open, onClose, taskQuery, workspaceId }) {
  // Backend retorna { task: ... }
  const task = taskQuery?.data?.task || taskQuery?.data;
  const taskId = task?.id;

  const [tab, setTab] = useState("checklist");

  const checklistQ = useChecklist(workspaceId, taskId);
  const toggleItem = useToggleChecklistItem(workspaceId, taskId);

  const commentsQ = useComments(workspaceId, taskId);
  const createComment = useCreateComment(workspaceId, taskId);

  const attachmentsQ = useAttachments(workspaceId, taskId);
  const depsQ = useDependencies(workspaceId, taskId);

  const aiPlan = useAiTaskPlan(workspaceId);

  const tone = useMemo(() => {
    if (!task) return "neutral";
    if (task.status === "done") return "success";
    if (task.status === "blocked") return "warning";
    if (task.status === "doing") return "secondary";
    return "neutral";
  }, [task]);

  function copyLink() {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  // Recebe o novo estado 'checked' do painel
  function onToggle(itemId, checked) {
    toggleItem.mutate({ itemId, checked });
  }

  return (
    <Drawer open={open} onClose={onClose} title="Tarefa">
      {!task ? (
        <div className="text-sm text-muted">Carregando tarefa...</div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-text">{task.title}</div>
              <div className="mt-1 text-sm text-muted">{task.description || "Sem descrição."}</div>
            </div>
            <Badge tone={tone} className="shrink-0">{task.status}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm">
              <div className="text-muted">Prazo</div>
              <div className="text-text mt-1">
                {task.dueAt ? new Date(task.dueAt).toLocaleString() : "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm">
              <div className="text-muted">Prioridade</div>
              <div className="text-text mt-1 capitalize">{task.priority || "—"}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={copyLink}>
              Copiar link
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => toast.message("Em breve: edição completa")}>
              Editar
            </Button>
          </div>

          {/* Tabs internas */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger tabValue="checklist">Checklist</TabsTrigger>
              <TabsTrigger tabValue="comments">Comentários</TabsTrigger>
              <TabsTrigger tabValue="deps">Deps</TabsTrigger>
              <TabsTrigger tabValue="files">Anexos</TabsTrigger>
              <TabsTrigger tabValue="ai">IA</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} tabValue="checklist">
              <ChecklistPanel checklistQ={checklistQ} onToggle={onToggle} toggling={toggleItem.isPending} />
            </TabsContent>

            <TabsContent value={tab} tabValue="comments">
              <CommentsPanel commentsQ={commentsQ} createComment={createComment} />
            </TabsContent>

            <TabsContent value={tab} tabValue="deps">
              <DependenciesPanel depsQ={depsQ} />
            </TabsContent>

            <TabsContent value={tab} tabValue="files">
              <AttachmentsPanel attachmentsQ={attachmentsQ} />
            </TabsContent>

            <TabsContent value={tab} tabValue="ai">
              <AiPanel task={task} aiPlan={aiPlan} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Drawer>
  );
}