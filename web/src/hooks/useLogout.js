import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { clearAccessToken } from "../lib/session";

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSettled: () => {
      clearAccessToken();
      qc.clear();
    }
  });
}