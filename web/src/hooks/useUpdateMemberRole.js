import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useUpdateMemberRole(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }) =>
      // Rota ajustada para /w/:workspaceId/members/:memberId
      apiFetch(`/w/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        body: { role } // workspaceId já está na URL
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaceMembers", workspaceId] })
  });
}