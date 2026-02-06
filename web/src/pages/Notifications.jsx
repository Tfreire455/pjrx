import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Check, Clock } from "lucide-react";
// CORREÇÃO: Imports com profundidade correta (../)
import { useNotifications } from "../hooks/useNotifications";
import { useMarkNotificationRead } from "../hooks/useMarkNotificationRead";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

export function Notifications() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const notifications = data?.notifications || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Bell className="text-primary" /> Notificações
        </h1>
      </div>
      
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted border border-dashed border-white/10 rounded-xl">
            Nenhuma notificação nova.
          </div>
        ) : (
          notifications.map(n => (
            <Card key={n.id} className={`transition-all hover:bg-white/5 border-white/10 ${n.read ? 'opacity-60 bg-transparent' : 'bg-surface'}`}>
              <CardContent className="p-4 flex gap-4 items-start">
                <div className={`p-2 rounded-full shrink-0 ${n.read ? 'bg-white/5 text-muted' : 'bg-primary/20 text-primary'}`}>
                  <Bell size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <Clock size={12} />
                    {n.createdAt && formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>

                {!n.read && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    title="Marcar como lida"
                    onClick={() => markRead.mutate(n.id)}
                    className="shrink-0 text-muted hover:text-primary"
                  >
                    <Check size={18} />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}