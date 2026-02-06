import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { clearAccessToken } from "../lib/session";

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate(); // Hook de navegação

  return useMutation({
    mutationFn: async () => {
      // Tenta avisar o backend. Se falhar (ex: servidor off), sai mesmo assim.
      try {
        return await apiFetch("/auth/logout", { method: "POST" });
      } catch (err) {
        console.warn("Logout falhou na API, forçando saída local:", err);
        return null;
      }
    },
    onSettled: () => {
      // 1. Limpa o token do LocalStorage/Cookies
      clearAccessToken();
      
      // 2. Limpa o cache do React Query (para apagar dados de usuário/projetos da memória)
      qc.clear();
      
      // 3. O PULO DO GATO: Redireciona o usuário para o Login
      navigate("/login", { replace: true });
    }
  });
}