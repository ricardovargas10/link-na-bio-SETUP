/** Ano atual no fuso de São Paulo (usado no rodapé). */
export function spYear(date: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(date));
}
