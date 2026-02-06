import React, { useState } from "react";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { toast } from "sonner";

export function ChecklistPanel({ workspaceId, task }) {
  const qc = useQueryClient();
  const [newItemText, setNewItemText] = useState("");
  
  // Pega a primeira checklist se existir
  const activeChecklistId = task?.checklists?.[0]?.id;

  // 1. Criar Checklist
  const createChecklist = useMutation({
    mutationFn: async () => {
      return apiFetch(`/w/${workspaceId}/checklists`, {
        method: "POST",
        body: { taskId: task.id, title: "Checklist" }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", workspaceId, task.id] });
      toast.success("Lista criada!");
    }
  });

  // 2. Adicionar Item
  const addItem = useMutation({
    mutationFn: async ({ checklistId, content }) => {
      return apiFetch(`/w/${workspaceId}/checklists/${checklistId}/items`, {
        method: "POST",
        body: { content }
      });
    },
    onSuccess: () => {
      setNewItemText("");
      qc.invalidateQueries({ queryKey: ["task", workspaceId, task.id] });
    }
  });

  // 3. Toggle Item
  const toggleItem = useMutation({
    mutationFn: async ({ itemId, done }) => {
      return apiFetch(`/w/${workspaceId}/checklist-items/${itemId}`, {
        method: "PATCH",
        body: { done }
      });
    },
    onMutate: async ({ itemId, done }) => {
        // Atualização Otimista
        const key = ["task", workspaceId, task.id];
        await qc.cancelQueries(key);
        const prev = qc.getQueryData(key);
        
        qc.setQueryData(key, (old) => {
            if (!old?.task?.checklists) return old;
            // Cria cópia profunda segura
            const newChecklists = old.task.checklists.map(list => ({
                ...list,
                items: list.items.map(item => item.id === itemId ? { ...item, done } : item)
            }));
            return { ...old, task: { ...old.task, checklists: newChecklists } };
        });
        return { prev };
    },
    onError: (err, vars, ctx) => qc.setQueryData(["task", workspaceId, task.id], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["task", workspaceId, task.id] })
  });

  // 4. Deletar Item
  const deleteItem = useMutation({
    mutationFn: async (itemId) => {
        return apiFetch(`/w/${workspaceId}/checklist-items/${itemId}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task", workspaceId, task.id] })
  });

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newItemText.trim()) return;

    if (!activeChecklistId) {
        // Se não tem lista, cria e depois adiciona
        try {
          const res = await createChecklist.mutateAsync();
          const newListId = res.checklist.id;
          addItem.mutate({ checklistId: newListId, content: newItemText });
        } catch (e) {
          toast.error("Erro ao criar lista.");
        }
    } else {
        addItem.mutate({ checklistId: activeChecklistId, content: newItemText });
    }
  }

  const checklists = task?.checklists || [];

  return (
    <div className="space-y-6">
      {/* Estado Vazio */}
      {checklists.length === 0 && (
        <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
          <p className="text-sm text-muted mb-3">Nenhuma checklist nesta tarefa.</p>
          <Button onClick={() => createChecklist.mutate()} disabled={createChecklist.isPending}>
            {createChecklist.isPending ? "Criando..." : "Criar Checklist"}
          </Button>
        </div>
      )}

      {/* Listas */}
      {checklists.map((list) => (
        <div key={list.id} className="space-y-3">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wider">{list.title}</h3>
          
          <div className="space-y-1">
            {list.items?.map((item) => (
              <div key={item.id} className="group flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                <button 
                    onClick={() => toggleItem.mutate({ itemId: item.id, done: !item.done })}
                    className={`mt-0.5 transition-colors ${item.done ? 'text-green-400' : 'text-muted hover:text-text'}`}
                >
                    {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <span className={`text-sm flex-1 transition-all ${item.done ? 'text-muted line-through decoration-white/20' : 'text-text'}`}>
                    {item.content}
                </span>
                <button 
                    onClick={() => deleteItem.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-opacity p-1"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Input de Adicionar */}
          <form onSubmit={handleAddItem} className="flex gap-2 mt-2 pl-8">
            <input 
                className="flex-1 bg-transparent border-b border-white/10 py-1 text-sm text-text focus:outline-none focus:border-primary placeholder:text-muted/50 transition-colors"
                placeholder="Adicionar item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 hover:text-primary" disabled={!newItemText.trim() || addItem.isPending}>
                <Plus size={16} />
            </Button>
          </form>
        </div>
      ))}
    </div>
  );
}