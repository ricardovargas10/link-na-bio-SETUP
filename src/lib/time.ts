/** Datas do painel sempre no fuso de São Paulo. No banco ficam em UTC (ISO). */
export const TZ = "America/Sao_Paulo";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function spParts(date: Date) {
  const p: Record<string, string> = {};
  for (const part of partsFmt.formatToParts(date)) p[part.type] = part.value;
  return p;
}

/** Diferença (em minutos) entre o horário de SP e o UTC naquele instante. Ex.: -180. */
function spOffsetMinutes(date: Date): number {
  const p = spParts(date);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** "2026-11-10T14:30" (horário de SP) -> ISO em UTC. Vazio -> null. Inválido -> undefined. */
export function spLocalToIso(local: string): string | null | undefined {
  const v = local.trim();
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return undefined;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const first = new Date(guess - spOffsetMinutes(new Date(guess)) * 60000);
  const d = new Date(guess - spOffsetMinutes(first) * 60000);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** ISO em UTC -> "2026-11-10T14:30" no horário de SP (para <input type="datetime-local">). */
export function isoToSpLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = spParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

const displayFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO -> "10/11/2026, 14:30" no horário de SP. */
export function formatSp(iso: string): string {
  return displayFmt.format(new Date(iso));
}

export function spYear(date: Date): number {
  return +spParts(date).year;
}
