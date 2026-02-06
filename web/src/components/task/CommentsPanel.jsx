import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, User } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useCreateComment } from "../../hooks/useCreateComment"; // Certifique-se que o caminho está correto

export function CommentsPanel({ workspaceId, taskId, comments = [] }) {
  const [text, setText] = useState("");
  const createComment = useCreateComment(workspaceId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await createComment.mutateAsync({ taskId, content: text });
      setText("");
      toast.success("Comentário enviado");
    } catch (e) {
      toast.error("Erro ao comentar");
    }
  }

  const safeComments = Array.isArray(comments) 
    ? [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          className="flex-1 bg-white/5 rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted/50"
          placeholder="Escreva um comentário..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!text.trim() || createComment.isPending}
        >
          <Send size={16} />
        </Button>
      </form>

      <div className="space-y-4 pt-2">
        {safeComments.length === 0 ? (
          <div className="text-center text-xs text-muted py-4">Nenhum comentário ainda.</div>
        ) : (
          safeComments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {c.author?.avatarUrl ? (
                  <img src={c.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-muted" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-text">{c.author?.name || "Desconhecido"}</span>
                  <span className="text-[10px] text-muted">
                    {c.createdAt && formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <div className="text-sm text-text/90 bg-white/5 p-3 rounded-tr-xl rounded-b-xl rounded-tl-sm border border-white/5">
                  {c.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}