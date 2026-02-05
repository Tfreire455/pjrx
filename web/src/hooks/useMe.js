import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/auth/me"),
    retry: false,
    staleTime: 15_000
  });
}