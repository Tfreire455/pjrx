import React, { useState } from "react";
import { format } from "date-fns";
import { Plus, Calendar, Target } from "lucide-react";
import { toast } from "sonner";
import { useSprints, useCreateSprint } from "../../hooks/useSprints";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

export function SprintBoard({ workspaceId, projectId }) {
  const sprintsQ = useSprints(workspaceId, projectId);
  const createSprint = useCreateSprint(workspaceId);
  const [isCreating, setCreating] = useState(false);

  const sprints = sprintsQ.data?.sprints || [];

  async function handleCreate() {
    const name = window.prompt("Nome da Sprint (ex: Sprint 1):");
    if (!name) return;
    
    // Datas fake para demo (começa hoje, termina em 14 dias)
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);

    setCreating(true);
    try {
      await createSprint.mutateAsync({
        projectId,
        name,
        goal: "Objetivo da sprint...",
        startAt: start.toISOString(),
        endAt: end.toISOString()
      });
      toast.success("Sprint criada!");
    } catch (e) {
      toast.error("Erro ao criar sprint");
    } finally {
      setCreating(false);
    }
  }

  if (sprintsQ.isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text">Sprints</h3>
        <Button size="sm" onClick={handleCreate} disabled={isCreating}>
          <Plus size={16} className="mr-2" /> Nova Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-muted text-sm">
          Nenhuma sprint planejada.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${sprint.status === 'active' ? 'bg-primary' : 'bg-white/10'}`} />
              <CardContent className="pt-6 pl-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-text">{sprint.name}</div>
                  <Badge tone={sprint.status === 'active' ? 'success' : 'neutral'}>{sprint.status}</Badge>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Calendar size={14} />
                    <span>{format(new Date(sprint.startAt), 'dd/MM')} - {format(new Date(sprint.endAt), 'dd/MM')}</span>
                  </div>
                  {sprint.goal && (
                    <div className="flex items-start gap-2 text-xs text-muted">
                      <Target size={14} className="mt-0.5" />
                      <span className="line-clamp-2">{sprint.goal}</span>
                    </div>
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