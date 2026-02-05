import React from "react";
import { Badge } from "../../components/ui/badge";

export function ProjectHeader({ project }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xl font-semibold text-text">{project?.name || "Projeto"}</div>
        <div className="text-sm text-muted">{project?.description || "Sem descrição."}</div>
      </div>

      <Badge tone="secondary">{project?.status || "active"}</Badge>
    </div>
  );
}