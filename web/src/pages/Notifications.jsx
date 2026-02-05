import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Bell, CheckCheck, Filter } from "lucide-react";

import { useNotificationsFeed } from "../hooks/useNotificationsFeed";
import { useMarkNotificationRead } from "../hooks/useMarkNotificationRead";

import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

function tone(type) {
  if (type === "task") return "primary";
  if (type === "project") return "secondary";
  if (type === "whatsapp") return "neutral";
  return "neutral";
}

export function Notifications() {
  const { workspaceId } = useParams(); // ID da URL

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [cursor, setCursor] = useState(null);

  const feedQ = useNotificationsFeed(workspaceId, { limit: 20, cursor, unread: unreadOnly ? true : null });
  const markRead = useMarkNotificationRead(workspaceId);

  if (feedQ.error) toast.error(feedQ.error.message);

  const payload = feedQ.data?.data || feedQ.data || {};
  const items = Array.isArray(payload.items || payload) ? (payload.items || payload) : [];
  const nextCursor = payload.nextCursor || payload.next_cursor || null;
  const unreadCount = items.filter((n) => !n.readAt).length;

  async function onRead(n) {
    if (n.readAt) return;
    try {
      await markRead.mutateAsync({ id: n.id });
      toast.success("Marcado como lido");
    } catch (e) {
      toast.error(e.message || "Falha ao marcar como lido");
    }
  }

  function loadMore() {
    if (!nextCursor) return;
    setCursor(nextCursor);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-text">Notificações</div>
          <div className="text-sm text-muted">Acompanhe as atualizações do workspace.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => { setUnreadOnly((v) => !v); setCursor(null); }}>
            <Filter size={16} />
            {unreadOnly ? "Mostrando: não lidas" : "Filtro: todas"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Bell size={18} /> Centro de notificações</CardTitle>
          <Badge tone={unreadCount ? "warning" : "success"}>{unreadCount ? `${unreadCount} não lidas` : "tudo ok"}</Badge>
        </CardHeader>

        <CardContent>
          {feedQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
            </div>
          ) : items?.length ? (
            <>
              <AnimatePresence>
                <div className="space-y-3">
                  {items.map((n) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 p-4 bg-white/3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-text truncate">{n.title || "Notificação"}</div>
                            <Badge tone={tone(n.type)}>{n.type || "system"}</Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted">{n.body || "—"}</div>
                          <div className="mt-2 text-xs text-muted opacity-80">{n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}</div>
                        </div>
                        <Button variant="ghost" onClick={() => onRead(n)} disabled={Boolean(n.readAt)}><CheckCheck size={16} /></Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" disabled={!nextCursor} onClick={loadMore}>{nextCursor ? "Carregar mais" : "Fim"}</Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted">Sem notificações.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}