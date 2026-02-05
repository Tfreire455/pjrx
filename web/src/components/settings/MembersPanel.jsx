import React from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

const ROLES = ["owner", "admin", "member", "guest"];

export function MembersPanel({ membersQ, updateRole, removeMember }) {
  const items = membersQ.data?.data || membersQ.data || [];
  const loading = membersQ.isLoading;

  async function onRole(memberId, role) {
    try {
      await updateRole.mutateAsync({ memberId, role });
      toast.success("Role atualizada");
    } catch (e) {
      toast.error(e.message || "Falha ao atualizar role");
    }
  }

  async function onRemove(m) {
    const ok = window.confirm(`Remover ${m.user?.name || "membro"} do workspace?`);
    if (!ok) return;
    try {
      await removeMember.mutateAsync({ memberId: m.id });
      toast.success("Membro removido");
    } catch (e) {
      toast.error(e.message || "Falha ao remover");
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text">Membros</div>
          <div className="text-xs text-muted">Gerencie roles e acesso por workspace.</div>
        </div>
        <Badge tone="secondary">{items.length}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : items?.length ? (
          items.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{m.user?.name || "Usuário"}</div>
                  <div className="text-xs text-muted truncate">{m.user?.email || "—"}</div>
                </div>

                <Badge tone={m.role === "owner" ? "success" : m.role === "admin" ? "primary" : "neutral"}>
                  {m.role}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <Button
                    key={r}
                    variant={m.role === r ? "secondary" : "ghost"}
                    onClick={() => onRole(m.id, r)}
                    disabled={updateRole.isPending || m.role === "owner"}
                    className="h-9"
                  >
                    {r}
                  </Button>
                ))}

                <div className="flex-1" />

                <Button
                  variant="ghost"
                  onClick={() => onRemove(m)}
                  disabled={removeMember.isPending || m.role === "owner"}
                  className="h-9"
                >
                  Remover
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted">Nenhum membro encontrado.</div>
        )}
      </div>
    </div>
  );
}
