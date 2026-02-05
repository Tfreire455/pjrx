import React, { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Send } from "lucide-react";

export function CommentsPanel({ commentsQ, createComment }) {
  const [text, setText] = useState("");

  const items = commentsQ?.data?.comments || commentsQ?.data?.data || commentsQ?.data || [];
  const loading = commentsQ?.isLoading;

  async function send() {
    const content = text.trim();
    if (!content) return;
    await createComment.mutateAsync({ content });
    setText("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/3 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-transparent outline-none text-sm text-text resize-none placeholder:text-muted/50"
          placeholder="Escreva um comentário..."
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="primary"
            disabled={createComment.isPending || !text.trim()}
            onClick={send}
          >
            {createComment.isPending ? "Enviando..." : <><Send size={14} className="mr-2" /> Comentar</>}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : items?.length ? (
          items.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   {/* Avatar placeholder se não tiver url */}
                   <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                      {c.author?.name?.[0] || "?"}
                   </div>
                   <div className="text-xs font-semibold text-text">{c.author?.name || "Usuário"}</div>
                </div>
                <div className="text-[10px] text-muted opacity-70">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                </div>
              </div>
              <div className="text-sm text-text/90 whitespace-pre-wrap leading-relaxed">
                {c.body || c.content} {/* DB usa 'body' */}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted text-center py-4">Nenhum comentário.</div>
        )}
      </div>
    </div>
  );
}