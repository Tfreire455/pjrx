import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { getAccessToken } from "../../lib/session";

export function RequireAuth({ children }) {
  const nav = useNavigate();
  const token = getAccessToken();

  const meQ = useMe();

  useEffect(() => {
    // Sem token: manda pra login
    if (!token) nav("/login", { replace: true });
  }, [token, nav]);

  useEffect(() => {
    // Se /me falhar (401/403), manda pra login
    if (meQ.isError) nav("/login", { replace: true });
  }, [meQ.isError, nav]);

  if (!token) return null;

  if (meQ.isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-surface p-4 text-sm text-muted">
          Validando sessão...
        </div>
      </div>
    );
  }

  return children;
}
