import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAiTaskPlan(workspaceId) {
  return useMutation({
    mutationFn: async ({ title, context }) => {
      // Rota Global de IA (não é /w/:id)
      return apiFetch("/ai/feature-implementation-plan", {
        method: "POST",
        body: { 
          workspaceId, 
          feature: title, // Mapeado: title -> feature
          context 
        }
      });
    }
  });
}