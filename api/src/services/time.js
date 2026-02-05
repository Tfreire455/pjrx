export function minutesSinceMidnightInTZ(date, timeZone) {
  // usa Intl pra obter hora/minuto no fuso
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });

  const parts = fmt.formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

export function isWithinQuietHours(now, pref) {
  if (!pref) return false;
  const tz = pref.timezone || "America/Sao_Paulo";
  const nowMin = minutesSinceMidnightInTZ(now, tz);

  const start = Number(pref.quietStartMin ?? 0);
  const end = Number(pref.quietEndMin ?? 0);

  // se start == end => sem quiet hours
  if (start === end) return false;

  // janela normal (ex: 22:00 -> 07:00 é “wrap”)
  if (start < end) return nowMin >= start && nowMin < end;

  // wrap (ex: 22:00 até 07:00)
  return nowMin >= start || nowMin < end;
}
