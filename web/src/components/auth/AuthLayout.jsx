import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="absolute inset-0 prjx-grid" />
      <div className="prjx-glow" />
      <div className="prjx-noise" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/25 flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text">PRJX</div>
              <div className="text-xs text-muted">Projetos em movimento. Sem caos.</div>
            </div>
          </Link>

          <Link to="/" className="text-xs text-muted underline underline-offset-4 hover:text-text">
            Voltar
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 items-start">
          <div className="rounded-2xl border border-white/10 bg-surface/75 backdrop-blur-xl p-7 shadow-soft">
            <div className="text-2xl font-semibold text-text">{title}</div>
            <div className="mt-2 text-sm text-muted">{subtitle}</div>

            <div className="mt-6">{children}</div>

            {footer ? (
              <div className="mt-5 text-sm text-muted">{footer}</div>
            ) : null}
          </div>

          <div className="hidden lg:block rounded-2xl border border-white/10 bg-white/3 p-7">
            <div className="text-sm font-semibold text-text">O que você ganha</div>
            <ul className="mt-3 space-y-3 text-sm text-muted">
              <li className="flex gap-2"><span className="text-success">✔</span> IA gera planos com riscos e próximos passos</li>
              <li className="flex gap-2"><span className="text-success">✔</span> Regras disparam alertas antes do atraso</li>
              <li className="flex gap-2"><span className="text-success">✔</span> Lembretes via WhatsApp com logs e idempotência</li>
              <li className="flex gap-2"><span className="text-success">✔</span> UX premium: motion + drawer spring + shimmer</li>
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-muted">Dica</div>
              <div className="mt-1 text-sm text-text">
                Use “Ver demo” na Landing para testar rápido, depois crie um workspace.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-muted opacity-80">
          PRJX • Seu Project OS com IA + WhatsApp
        </div>
      </div>
    </div>
  );
}
