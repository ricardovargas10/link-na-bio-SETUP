/**
 * Conteúdo da página. Para mudar um texto ou link, edite aqui e publique.
 *
 * Cada botão:
 * - label: texto do botão
 * - url: endereço (https://, mailto: ou tel:)
 * - icon: um dos nomes de src/lib/icon-names.ts (ex.: "whatsapp", "instagram", "formulario")
 * - destaque: true deixa o botão laranja, com texto branco e brilho passando
 */
import type { IconName } from "@/lib/icon-names";

export type SiteButton = { label: string; url: string; icon: IconName; destaque?: boolean };

const WHATSAPP_MESSAGE = "Olá! Vim pelo Instagram e quero saber mais sobre as aulas da Set Up.";

export const site = {
  headline: "O inglês começa aqui e leva você para onde você quiser",
  /** Trecho do texto de cima que fica na caixa azul (precisa ser igual ao do texto). */
  highlight: "onde você quiser",

  buttons: [
    {
      label: "Preencha o formulário de interesse",
      url: "https://forms.gle/s3ceKouJgCnn1jh47",
      icon: "formulario",
      destaque: true,
    },
    {
      label: "Chamar no WhatsApp",
      url: `https://wa.me/5511915467152?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
      icon: "whatsapp",
    },
    { label: "Envie um e-mail", url: "mailto:atendimento@setupenglish.com.br", icon: "email" },
    { label: "Siga no Instagram", url: "https://www.instagram.com/setup.english/", icon: "instagram" },
  ] as SiteButton[],

  aboutTitle: "Sobre a Set Up",
  aboutText:
    "A Set Up é uma escola de inglês feita para brasileiros. A gente parte das dificuldades de quem fala português para você aprender o inglês que vai usar de verdade e ganhar confiança para falar.",

  /** {ano} vira o ano atual. */
  footer: "@setup.english · {ano}",
};
