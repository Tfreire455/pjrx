import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { setAccessToken } from "../lib/session";

export function AuthCallback() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      toast.error(decodeURIComponent(error));
      nav("/login", { replace: true });
      return;
    }

    if (!token) {
      toast.error("Token não recebido no callback.");
      nav("/login", { replace: true });
      return;
    }

    setAccessToken(token);
    toast.success("Login com Google concluído!");
    nav("/app", { replace: true });
  }, [params, nav]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-surface p-6 text-sm text-muted">
        Finalizando autenticação...
      </div>
    </div>
  );
}