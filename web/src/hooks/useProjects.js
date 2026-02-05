import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProjects(workspaceId) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: () => apiFetch(`/w/${workspaceId}/projects`),
    staleTime: 20_000
  });
}

// --- NOVO: Hook para criar projeto ---
export function useCreateProject(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiFetch(`/w/${workspaceId}/projects`, { 
      method: "POST", 
      body: { 
        workspaceId,
        ...data 
      } 
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", workspaceId] });
    }
  });
}