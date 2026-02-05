import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";

// Schema do formulário (Front)
const FormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  // No form usamos objetos { text } para o useFieldArray controlar os inputs
  items: z.array(z.object({ text: z.string().min(1, "Obrigatório") }))
    .min(1, "Adicione pelo menos um item")
});

export function TemplateModal({ open, onClose, initial, onSave, saving }) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", description: "", items: [{ text: "" }] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Reseta o form quando abre/fecha ou muda edição
  useEffect(() => {
    if (open) {
      if (initial) {
        // Converte array de strings (DB) para array de objetos (Form)
        const items = (initial.items || []).map(text => ({ text }));
        reset({ name: initial.name, description: initial.description || "", items });
      } else {
        reset({ name: "", description: "", items: [{ text: "" }] });
      }
    }
  }, [open, initial, reset]);

  const onSubmit = (data) => {
    // Converte de volta para array de strings simples para a API
    const payload = {
      ...data,
      items: data.items.map(i => i.text)
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <form id="tpl-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted uppercase">Nome do template</label>
            <input
              {...register("name")}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
              placeholder="Ex: Deploy Produção"
            />
            {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted uppercase">Descrição</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 resize-none"
              placeholder="Opcional..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted uppercase flex justify-between">
              Itens da Checklist
              <span className="text-xs normal-case opacity-70">{fields.length} itens</span>
            </label>
            
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center group">
                  <GripVertical size={14} className="text-muted/30 cursor-grab" />
                  <input
                    {...register(`items.${index}.text`)}
                    className="flex-1 bg-white/5 border border-transparent rounded px-2 py-1.5 text-sm text-text focus:bg-black/20 focus:border-white/10 outline-none transition"
                    placeholder={`Item ${index + 1}`}
                    autoFocus={index === fields.length - 1 && index > 0} 
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-muted hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {errors.items && <p className="text-xs text-red-400">{errors.items.message}</p>}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full mt-2 border-dashed border-white/20 bg-transparent hover:bg-white/5"
              onClick={() => append({ text: "" })}
            >
              <Plus size={14} className="mr-2" /> Adicionar item
            </Button>
          </div>
        </form>

        <DialogFooter className="mt-4 pt-3 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="tpl-form" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}