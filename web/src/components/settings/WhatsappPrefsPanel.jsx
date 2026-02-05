import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

function validE164(v) {
  const s = (v || "").trim();
  return /^\+\d{10,15}$/.test(s); // ex: +5511999999999
}

export function WhatsappPrefsPanel({ prefsQ, savePrefs }) {
  const loading = prefsQ.isLoading;
  const data = prefsQ.data?.data || prefsQ.data || null;

  const [enabled, setEnabled] = useState(true);
  const [phone, setPhone] = useState("");
  const [start, setStart] = useState("22:00");
  const [end, setEnd] = useState("08:00");

  useEffect(() => {
    if (!data) return;
    setEnabled(Boolean(data.enabled));
    setPhone(data.phoneE164 || "");
    setStart(data.quietHoursStart || "22:00");
    setEnd(data.quietHoursEnd || "08:00");
  }, [data]);

  const ok = useMemo(() => {
    if (!enabled) return true;
    return validE164(phone) && start && end;
  }, [enabled, phone, start, end]);

  async function save() {
    if (!ok) {
      toast.error("Informe um telefone válido em E.164 (+55...) e quiet hours.");
      return;
    }
    try {
      await savePrefs.mutateAsync({
        enabled,
        phoneE164: phone.trim(),
        quietHoursStart: start,
        quietHoursEnd: end
      });
      toast.success("Preferências salvas!");
    } catch (e) {
      toast.error(e.message || "Falha ao salvar preferências");
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text">WhatsApp Reminders</div>
          <div className="text-xs text-muted">Quiet hours + telefone de destino.</div>
        </div>
        <Badge tone={enabled ? "success" : "warning"}>{enabled ? "ativo" : "desativado"}</Badge>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-3">
            <div className="text-sm text-text">Habilitar lembretes</div>
            <button
              type="button"
              onClick={() => setEnabled((v) => !v)}
              className={[
                "h-9 w-16 rounded-2xl border border-white/10 transition px-2",
                enabled ? "bg-success/20" : "bg-white/5"
              ].join(" ")}
            >
              <div
                className={[
                  "h-7 w-7 rounded-2xl bg-white/15 border border-white/10 transition",
                  enabled ? "translate-x-6" : "translate-x-0"
                ].join(" ")}
              />
            </button>
          </div>

          <div>
            <div className="text-xs text-muted mb-1">Telefone (E.164)</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!enabled}
              className="w-full h-11 rounded-2xl bg-white/3 border border-white/10 px-4 text-text outline-none focus:border-primary/40 disabled:opacity-60"
              placeholder="+5511999999999"
            />
            <div className="text-xs text-muted mt-1 opacity-80">
              Dica: sempre com “+55” e DDD. Ex.: +5511999999999
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted mb-1">Quiet hours (início)</div>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                disabled={!enabled}
                className="w-full h-11 rounded-2xl bg-white/3 border border-white/10 px-4 text-text outline-none focus:border-primary/40 disabled:opacity-60"
              />
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Quiet hours (fim)</div>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={!enabled}
                className="w-full h-11 rounded-2xl bg-white/3 border border-white/10 px-4 text-text outline-none focus:border-primary/40 disabled:opacity-60"
              />
            </div>
          </div>

          <Button className="w-full" disabled={savePrefs.isPending} onClick={save}>
            {savePrefs.isPending ? "Salvando..." : "Salvar preferências"}
          </Button>
        </div>
      )}
    </div>
  );
}
