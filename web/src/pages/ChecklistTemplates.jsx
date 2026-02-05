import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useChecklistTemplates } from "../hooks/useChecklistTemplates";
import { useCreateChecklistTemplate } from "../hooks/useCreateChecklistTemplate";
import { useUpdateChecklistTemplate } from "../hooks/useUpdateChecklistTemplate";
import { useDeleteChecklistTemplate } from "../hooks/useDeleteChecklistTemplate";
import { TemplateCard } from "../components/templates/TemplateCard";
import { TemplateModal } from "../components/templates/TemplateModal";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export function ChecklistTemplates() {
  const { workspaceId } = useParams();

  const templatesQ = useChecklistTemplates(workspaceId);
  const createTpl = useCreateChecklistTemplate(workspaceId);
  const updateTpl = useUpdateChecklistTemplate(workspaceId);
  const deleteTpl = useDeleteChecklistTemplate(workspaceId);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // --- CORREÇÃO DE LEITURA DE DADOS ---
  // O backend retorna: { ok: true, data: { templates: [...] } }
  const payload = templatesQ.data?.data || templatesQ.data || {};
  // Extraímos a propriedade .templates do payload
  const items = payload.templates || []; 
  // ------------------------------------

  async function save(payload) {
    try {
      if (editing?.id) {
        await updateTpl.mutateAsync({ id: editing.id, ...payload });
        toast.success("Template atualizado!");
      } else {
        await createTpl.mutateAsync(payload);
        toast.success("Template criado!");
      }
      setOpen(false);
      setEditing(null);
    } catch (e) {
      toast.error(e.message || "Falha ao salvar template");
    }
  }

  async function onDelete(tpl) {
    const ok = window.confirm(`Excluir template "${tpl.name}"?`);
    if (!ok) return;
    try {
      await deleteTpl.mutateAsync({ id: tpl.id });
      toast.success("Template excluído!");
    } catch (e) {
      toast.error(e.message || "Falha ao excluir");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-text">Checklist Templates</div>
          <div className="text-sm text-muted">Gerencie padrões para tarefas repetitivas.</div>
        </div>

        <Button
          onClick={() => { setEditing(null); setOpen(true); }}
          disabled={!workspaceId}
        >
          Novo template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templatesQ.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : items?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onEdit={() => { setEditing(tpl); setOpen(true); }}
                  onDelete={() => onDelete(tpl)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">Nenhum template criado ainda.</div>
          )}
        </CardContent>
      </Card>

      <TemplateModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        initial={editing}
        onSave={save}
        saving={createTpl.isPending || updateTpl.isPending}
      />
    </div>
  );
}