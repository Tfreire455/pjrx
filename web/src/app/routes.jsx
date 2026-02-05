import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { AppShell } from "../components/layout/AppShell";
import { RouteTransition } from "../components/motion/RouteTransition";
import { ForgotPassword } from "../pages/ForgotPassword";
import { AuthCallback } from "../pages/AuthCallback";
import { Project } from "../pages/Project";
import { ChecklistTemplates } from "../pages/ChecklistTemplates";
import { Notifications } from "../pages/Notifications";
import { Settings } from "../pages/Settings";

function RequireAuth({ children }) {
  const token = localStorage.getItem("prjx_access_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <RouteTransition>
      <Routes>
        {/* --- Rotas Públicas --- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* --- Rotas Protegidas (/app) --- */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* 1. Dashboard Raiz (Carrega o default via lógica interna) */}
          <Route index element={<Dashboard />} />

          {/* 2. Rotas "Escopadas" por Workspace (O padrão do seu sistema agora) */}
          
          {/* Dashboard específico de um workspace (para troca de contexto) */}
          <Route path="w/:workspaceId" element={<Dashboard />} />

          {/* Projetos e Tarefas (Deep Link) */}
          <Route path="w/:workspaceId/p/:projectId" element={<Project />} />
          <Route path="w/:workspaceId/p/:projectId/t/:taskId" element={<Project />} />

          {/* Funcionalidades que agora exigem workspaceId na URL */}
          <Route path="w/:workspaceId/templates/checklists" element={<ChecklistTemplates />} />
          <Route path="w/:workspaceId/notifications" element={<Notifications />} />
          <Route path="w/:workspaceId/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteTransition>
  );
}