/**
 * Botões fixos da página. Para mudar, edite esta lista:
 * - label: texto do botão
 * - url: endereço
 * - icon: "whatsapp" | "email" | "instagram"
 * - order: posição (menor aparece primeiro)
 */
export type FixedLinkIcon = "whatsapp" | "email" | "instagram";

export type FixedLink = {
  label: string;
  url: string;
  icon: FixedLinkIcon;
  order: number;
};

const WHATSAPP_MESSAGE =
  "Olá! Vim pelo Instagram e quero saber mais sobre as aulas da Set Up.";

export const fixedLinks: FixedLink[] = [
  {
    label: "Chamar no WhatsApp",
    url: `https://wa.me/5511915467152?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
    icon: "whatsapp",
    order: 1,
  },
  {
    label: "Envie um e-mail",
    url: "mailto:atendimento@setupenglish.com.br",
    icon: "email",
    order: 2,
  },
  {
    label: "Siga no Instagram",
    url: "https://www.instagram.com/setup.english/",
    icon: "instagram",
    order: 3,
  },
];

export const instagramHandle = "@setup.english";
