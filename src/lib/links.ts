/** Links externos abrem em nova aba; mailto abre o app de e-mail na mesma aba. */
export function externalLinkProps(url: string) {
  if (url.startsWith("mailto:")) return {};
  return { target: "_blank", rel: "noopener noreferrer" } as const;
}
