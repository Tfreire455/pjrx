import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, KanbanSquare, BellRing, Sparkles, ShieldCheck, Wand2, Rocket } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { FeatureCard } from "../components/landing/FeatureCard";
import { Testimonial } from "../components/landing/Testimonial";
import { StickyCTA } from "../components/landing/StickyCTA";

function useStickyCtaTrigger() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function onScroll() { setVisible((window.scrollY || 0) > 220); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return visible;
}

function GlowDivider() {
  return (
    <div className="relative my-10">
      <div className="h-px w-full bg-white/10" />
      <div className="absolute inset-x-0 -top-10 h-20 bg-gradient-to-r from-primary/0 via-primary/25 to-primary/0 blur-2xl opacity-70" />
    </div>
  );
}

export function Landing() {
  const stickyVisible = useStickyCtaTrigger();
  const bullets = useMemo(() => ["IA quebra projetos em tarefas e sprints", "WhatsApp lembra você antes do atraso", "Kanban fluido com UX premium"], []);

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="absolute inset-0 prjx-grid" />
      <div className="prjx-glow" />
      <div className="prjx-noise" />
      <StickyCTA visible={stickyVisible} />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/25 flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text">PRJX</div>
              <div className="text-xs text-muted">Projetos em movimento. Sem caos.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Entrar</Button></Link>
            <Link to="/register"><Button>Começar</Button></Link>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-12">
          <Badge tone="primary">Seu Project OS com IA + WhatsApp</Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl font-semibold text-text leading-tight">
            Gerencie projetos com IA e receba lembretes no WhatsApp antes de perder prazos.
          </h1>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            O PRJX organiza tarefas, checklists e sprints — e ainda atua como copiloto estratégico: planeja, detecta riscos e sugere inovações.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register"><Button size="lg">Criar workspace <ArrowRight size={18} /></Button></Link>
            <Link to="/login"><Button size="lg" variant="secondary">Ver demo</Button></Link>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {bullets.map((b) => (
              <div key={b} className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-text">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
        
        <GlowDivider />
        {/* Rest of Landing Content (Features, How it Works, etc.) - Preserved */}
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard icon={Wand2} title="IA Coprojetista" desc="Planeja sprints, detecta riscos e sugere inovações." tone="primary" />
          <FeatureCard icon={BellRing} title="WhatsApp Reminders" desc="Jobs agendados com idempotência e retry." tone="secondary" />
        </div>
      </div>
    </div>
  );
}