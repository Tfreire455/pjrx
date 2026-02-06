import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Target, Plus, ChevronRight, CheckCircle2 } from "lucide-react";
import { useSprints, useCreateSprint } from "../../hooks/useSprints";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { toast } from "sonner";

export function SprintBoard({ workspaceId, projectId }) {
  const { data, isLoading } = useSprints(workspaceId, projectId);
  const createSprint = useCreateSprint(workspaceId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: "", goal: "", duration: 14 });

  const sprints = data?.sprints || [];

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const startAt = new Date();
      const endAt = new Date();
      endAt.setDate(endAt.getDate() + parseInt(newSprint.duration));

      await createSprint.mutateAsync({
        projectId,
        name: newSprint.name,
        goal: newSprint.goal,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString()
      });
      setIsModalOpen(false);
      setNewSprint({ name: "", goal: "", duration: 14 });
      toast.success("Sprint criada!");
    } catch (e) {
      toast.error("Erro ao criar sprint");
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text">Sprints</h3>
          <p className="text-sm text-muted">Gerencie ciclos de desenvolvimento.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={16} /> Nova Sprint
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sprints.map((sprint) => {
          const isActive = new Date() >= new Date(sprint.startAt) && new Date() <= new Date(sprint.endAt);
          // Simulação de progresso (idealmente viria do backend como projects)
          const progress = Math.floor(Math.random() * 100); 

          return (
            <Card key={sprint.id} className={`border-white/10 transition-all hover:border-primary/50 ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-surface'}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg text-text">{sprint.name}</h4>
                      {isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 uppercase font-bold tracking-wider">Ativa</span>}
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {format(new Date(sprint.startAt), "d MMM", { locale: ptBR })} - {format(new Date(sprint.endAt), "d MMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="flex items-start gap-2">
                    <Target size={14} className="text-primary mt-0.5" />
                    <p className="text-sm text-muted italic line-clamp-2">"{sprint.goal}"</p>
                  </div>
                </div>

                {/* Barra de Progresso da Sprint */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <Button variant="ghost" className="w-full text-xs justify-between group h-8">
                  Ver Tarefas <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        
        {sprints.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
            <p className="text-muted">Nenhuma sprint planejada.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planejar Nova Sprint</DialogTitle>
            <DialogDescription>Defina o objetivo e a duração do ciclo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted uppercase">Nome</label>
              <input className="w-full bg-white/5 border border-white/10 rounded p-2 text-text" 
                value={newSprint.name} onChange={e => setNewSprint({...newSprint, name: e.target.value})} placeholder="Ex: Sprint 23" autoFocus />
            </div>
            <div>
              <label className="text-xs text-muted uppercase">Objetivo (Goal)</label>
              <textarea className="w-full bg-white/5 border border-white/10 rounded p-2 text-text h-20 resize-none" 
                value={newSprint.goal} onChange={e => setNewSprint({...newSprint, goal: e.target.value})} placeholder="Ex: Implementar autenticação..." />
            </div>
            <div>
              <label className="text-xs text-muted uppercase">Duração (Dias)</label>
              <select className="w-full bg-white/5 border border-white/10 rounded p-2 text-text"
                value={newSprint.duration} onChange={e => setNewSprint({...newSprint, duration: e.target.value})}>
                <option value="7">1 Semana</option>
                <option value="14">2 Semanas</option>
                <option value="21">3 Semanas</option>
                <option value="30">1 Mês</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={createSprint.isPending}>
              {createSprint.isPending ? "Criando..." : "Confirmar Sprint"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}