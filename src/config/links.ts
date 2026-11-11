/**
 * Botões fixos da página. Para mudar, edite esta lista:
 * - label: texto do botão
 * - url: endereço
 * - icon: "form" | "whatsapp" | "email" | "instagram"
 * - order: posição (menor aparece primeiro)
 */
export type FixedLinkIcon = "form" | "whatsapp" | "email" | "instagram";

export type FixedLink = {
  label: string;
  url: string;
  icon: FixedLinkIcon;
  order: number;
};

const WHATSAPP_MESSAGE =
  "Olá! Vim pelo Instagram e quero saber mais sobre as aulas da Set Up.";

// O link do formulário é trocado pelo painel ("Link do formulário").
// Este endereço é só o valor inicial, usado enquanto nada for salvo lá.
const FORM_URL = "https://www.google.com";

export const fixedLinks: FixedLink[] = [
  {
    label: "Preencha o formulário de interesse",
    url: FORM_URL,
    icon: "form",
    order: 0,
  },
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

/** Texto que aparece embaixo dos botões. */
export const aboutTitle = "Sobre a Set Up";
export const aboutText =
  "A Set Up é uma escola de inglês feita para brasileiros. A gente parte das dificuldades de quem fala português para você aprender o inglês que vai usar de verdade e ganhar confiança para falar.";
