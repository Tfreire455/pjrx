const MAX_LEN = 12000;

export function sanitizeUserText(input) {
  const s = String(input || "");

  // remove tags básicas
  const noHtml = s.replace(/<[^>]*>/g, "");

  // corta tamanho
  const trimmed = noHtml.slice(0, MAX_LEN);

  // heurística simples contra “override”
  const lowered = trimmed.toLowerCase();
  const blockedPhrases = [
    "ignore previous instructions",
    "ignore all previous instructions",
    "you are chatgpt",
    "system prompt",
    "developer message",
    "reveal your instructions",
    "bypass",
    "jailbreak"
  ];

  const flagged = blockedPhrases.some((p) => lowered.includes(p));

  return {
    text: trimmed,
    flagged
  };
}
