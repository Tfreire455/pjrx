import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";

const FormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  items: z.array(z.object({ text: z.string().min(1, "Item vazio") }))
    .min(1, "Adicione pelo menos um item")
});

export function TemplateModal({ open, onClose, initial, onSave, saving }) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", description: "", items: [{ text: "" }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) {
      if (initial) {
        // Mapeia array de strings ["A"] para array de objetos [{text: "A"}]
        reset({
          name: initial.name,
          description: initial.description || "",
          items: (initial.items || []).map(t => ({ text: t }))
        });
      } else {
        reset({ name: "", description: "", items: [{ text: "" }] });
      }
    }
  }, [open, initial, reset]);

  const onSubmit = (data) => {
    // Converte de volta para array de strings para a API
    onSave({
      ...data,
      items: data.items.map(i => i.text)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <form id="tpl-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted uppercase">Nome</label>
            <input {...register("name")} className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-text" placeholder="Ex: Deploy Padrão" />
            {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted uppercase">Descrição</label>
            <textarea {...register("description")} rows={2} className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-text resize-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted uppercase">Itens da Checklist</label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <GripVertical size={14} className="text-muted/30" />
                  <input
                    {...register(`items.${index}.text`)}
                    className="flex-1 bg-white/5 border border-transparent rounded px-2 py-1.5 text-sm text-text focus:border-white/20 outline-none"
                    placeholder="Item da lista..."
                  />
                  <button type="button" onClick={() => remove(index)} className="text-muted hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" className="w-full mt-2" onClick={() => append({ text: "" })}>
              <Plus size={14} className="mr-2" /> Adicionar Item
            </Button>
            {errors.items && <p className="text-xs text-red-400">{errors.items.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="tpl-form" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}