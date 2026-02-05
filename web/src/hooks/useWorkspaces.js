import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiFetch("/workspaces"),
    staleTime: 30_000,
    // CORREÇÃO AUTOMÁTICA DO JSON ANINHADO (baseado no seu print)
    select: (res) => {
      // Se vier data.data (como no print), retorna o array interno
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      // Fallbacks normais
      if (res.workspaces) return res.workspaces;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
      return [];
    }
  });
}