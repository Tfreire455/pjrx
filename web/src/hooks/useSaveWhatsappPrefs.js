import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useSaveWhatsappPrefs(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/whatsapp/prefs", {
        method: "PUT",
        body: { workspaceId, ...payload }
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsappPrefs", workspaceId] })
  });
}