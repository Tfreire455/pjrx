import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
// IMPORTAÇÃO MOVIDA PARA DENTRO DO COMPONENTE
import { useCreateProject } from "../../hooks/useProjects";

const Schema = z.object({
  name: z.string().min(2, "Nome é obrigatório (min 2 chars)"),
  description: z.string().optional()
});

// Agora recebe workspaceId em vez da mutation pronta
export function CreateProjectModal({ open, onClose, workspaceId }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(Schema)
  });

  // O hook roda aqui dentro, garantindo que "createProject" sempre exista
  const createProject = useCreateProject(workspaceId);

  async function onSubmit(data) {
    try {
      await createProject.mutateAsync(data);
      toast.success("Projeto criado!");
      reset();
      onClose();
    } catch (e) {
      toast.error(e.message || "Erro ao criar projeto");
    }
  }

  // Fallback seguro se por acaso a mutation falhar ao inicializar (raro)
  const isPending = createProject?.isPending || false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        
        <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-text">Nome do Projeto</label>
            <input
              {...register("name")}
              className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm shadow-sm transition-colors text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="Ex: Lançamento do App"
              autoFocus
            />
            {errors.name && <p className="text-[0.8rem] text-red-400">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-text">Descrição (Opcional)</label>
            <textarea
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm shadow-sm text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
              placeholder="Descreva o objetivo..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="create-project-form" disabled={isPending}>
            {isPending ? "Criando..." : "Criar Projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}