import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useRemoveMember(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId }) =>
      // Rota ajustada para /w/:workspaceId/members/:memberId
      apiFetch(`/w/${workspaceId}/members/${memberId}`, {
        method: "DELETE"
        // Não precisa body com workspaceId pois já está na URL
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaceMembers", workspaceId] })
  });
}