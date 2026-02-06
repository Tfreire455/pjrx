import React, { useState, useMemo } from "react";
import { Plus, Calendar, Target, CheckCircle2, PlayCircle, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useSprints, useCreateSprint, useUpdateSprint } from "../../hooks/useSprints";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

function extractSprints(res) {
  if (!res) return [];
  if (res.sprints && Array.isArray(res.sprints)) return res.sprints;
  if (res.data && res.data.sprints && Array.isArray(res.data.sprints)) return res.data.sprints;
  return Array.isArray(res) ? res : [];
}

export function SprintBoard({ workspaceId, projectId }) {
  const sprintsQ = useSprints(workspaceId, projectId);
  const createSprint = useCreateSprint(workspaceId);
  const updateSprint = useUpdateSprint(workspaceId); // Hook de update
  
  const [isCreating, setCreating] = useState(false);

  const sprints = useMemo(() => extractSprints(sprintsQ.data), [sprintsQ.data]);

  // Criação Manual
  async function handleCreate() {
    const name = window.prompt("Nome da Sprint:");
    if (!name) return;
    setCreating(true);
    try {
      const start = new Date();
      const end = new Date(); 
      end.setDate(end.getDate() + 14);
      await createSprint.mutateAsync({ projectId, name, startAt: start.toISOString(), endAt: end.toISOString() });
      toast.success("Sprint criada!");
    } catch { toast.error("Erro ao criar"); }
    finally { setCreating(false); }
  }

  // Atualizar Status (Progresso)
  async function handleStatus(sprint, newStatus) {
    try {
      await updateSprint.mutateAsync({ id: sprint.id, status: newStatus });
      toast.success(`Sprint agora está ${newStatus}`);
    } catch { toast.error("Erro ao atualizar sprint"); }
  }

  if (sprintsQ.isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text">Sprints</h3>
        <Button size="sm" onClick={handleCreate} disabled={isCreating}><Plus size={16} className="mr-2"/> Nova Sprint</Button>
      </div>

      {sprints.length === 0 ? (
        <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-muted text-sm">
          Sem sprints. Use a IA para gerar ou crie uma manual.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((s) => (
            <Card key={s.id} className="relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${s.status === 'active' ? 'bg-primary' : s.status === 'completed' ? 'bg-green-500' : 'bg-white/10'}`} />
              <CardContent className="pt-5 pl-5 pr-4 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-text">{s.name}</div>
                  <Badge tone={s.status === 'active' ? 'primary' : s.status === 'completed' ? 'success' : 'neutral'}>{s.status}</Badge>
                </div>
                
                <div className="space-y-3 mt-4 text-xs text-muted">
                  <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded w-fit">
                    <Calendar size={12} />
                    <span>{new Date(s.startAt).toLocaleDateString()} - {new Date(s.endAt).toLocaleDateString()}</span>
                  </div>
                  {s.goal && <div className="italic border-l-2 border-white/10 pl-2">{s.goal}</div>}
                </div>

                {/* Controles de Status */}
                <div className="mt-4 flex gap-2 pt-3 border-t border-white/5 opacity-60 group-hover:opacity-100 transition">
                  {s.status !== 'active' && s.status !== 'completed' && (
                    <Button size="xs" variant="secondary" className="w-full" onClick={() => handleStatus(s, 'active')}>
                      <PlayCircle size={14} className="mr-1"/> Iniciar
                    </Button>
                  )}
                  {s.status === 'active' && (
                    <Button size="xs" variant="secondary" className="w-full" onClick={() => handleStatus(s, 'completed')}>
                      <CheckCircle2 size={14} className="mr-1"/> Concluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}