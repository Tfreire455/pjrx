import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Paperclip } from "lucide-react";

export function AttachmentsPanel({ attachmentsQ }) {
  // Hook useAttachments retorna lista padrão
  const items = attachmentsQ?.data?.data || attachmentsQ?.data || [];
  const loading = attachmentsQ?.isLoading;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!items?.length) {
    return <div className="text-sm text-muted p-4 text-center border border-dashed border-white/10 rounded-xl">Sem anexos.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id} className="rounded-2xl border border-white/10 bg-white/3 p-3 flex items-center justify-between gap-3 group hover:bg-white/5 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted">
              <Paperclip size={14} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text truncate">{a.filename || "Arquivo"}</div>
              <div className="text-xs text-muted truncate">{a.mimeType || "—"}</div>
            </div>
          </div>
          <Badge tone="neutral">{a.sizeBytes ? `${Math.round(a.sizeBytes / 1024)}kb` : "—"}</Badge>
        </div>
      ))}
    </div>
  );
}