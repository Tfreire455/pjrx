import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { toast } from "sonner";

import { AiPanel } from "../task/AiPanel";
import { ChecklistPanel } from "../task/ChecklistPanel";
import { CommentsPanel } from "../task/CommentsPanel";

import { apiFetch } from "../../lib/api";

export function TaskDrawer({ open, onClose, taskQuery, workspaceId }) {
  const qc = useQueryClient();
  const taskData = taskQuery.data?.task || taskQuery.data?.data?.task || null;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (taskData) {
      setTitle(taskData.title || "");
      setDescription(taskData.description || "");
    }
  }, [taskData]);

  async function handleSave(field, value) {
    if (!taskData) return;
    try {
      await apiFetch(`/w/${workspaceId}/tasks/${taskData.id}`, {
        method: "PATCH",
        body: { [field]: value }
      });
      qc.invalidateQueries({ queryKey: ["task", workspaceId, taskData.id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Salvo!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
  }

  if (taskQuery.isLoading && open) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 bg-surface border-white/10 flex flex-col">
           <DialogHeader className="sr-only">
             <DialogTitle>Carregando...</DialogTitle>
             <DialogDescription>Aguarde o carregamento da tarefa</DialogDescription>
           </DialogHeader>
           <div className="p-6 space-y-4">
             <Skeleton className="h-8 w-1/2" />
             <Skeleton className="h-32 w-full" />
           </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!taskData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed right-0 top-0 h-full w-full sm:max-w-xl md:max-w-2xl border-l border-white/10 bg-surface p-0 shadow-2xl transition-transform duration-300 data-[state=closed]:translate-x-full overflow-hidden flex flex-col translate-x-[0%] !translate-y-[0%] !top-0 !left-auto rounded-none">
        
        <DialogHeader className="sr-only">
          <DialogTitle>Editando: {taskData.title}</DialogTitle>
          <DialogDescription>Detalhes da tarefa selecionada</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex gap-2">
            <Badge variant="outline">{taskData.status}</Badge>
            <Badge variant="outline" className="opacity-50">{taskData.priority}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div>
            <input
              className="w-full bg-transparent text-xl font-bold text-text focus:outline-none border-b border-transparent focus:border-primary/50 transition-colors pb-1 placeholder:text-muted/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSave("title", title)}
              placeholder="Título da tarefa"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted uppercase mb-1 block">Descrição</label>
            <textarea
              className="w-full min-h-[100px] bg-white/5 rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y placeholder:text-muted/30"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSave("description", description)}
              placeholder="Adicione detalhes..."
            />
          </div>

          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 gap-4 mb-4">
              <TabsTrigger value="checklist" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-2 bg-transparent">Checklist</TabsTrigger>
              <TabsTrigger value="ai" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-2 bg-transparent">IA Plan</TabsTrigger>
              <TabsTrigger value="comments" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-2 bg-transparent">Comentários</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-0">
              <ChecklistPanel workspaceId={workspaceId} task={taskData} />
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              {/* CORREÇÃO: Passando o projectId corretamente */}
              <AiPanel 
                workspaceId={workspaceId} 
                projectId={taskData.projectId}
                taskId={taskData.id} 
                taskTitle={title} 
                taskDescription={description} 
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <CommentsPanel workspaceId={workspaceId} taskId={taskData.id} comments={taskData.comments} />
            </TabsContent>
          </Tabs>

        </div>
      </DialogContent>
    </Dialog>
  );
}