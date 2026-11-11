import {
  IconBrandDiscord,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandKick,
  IconBrandLinkedin,
  IconBrandPinterest,
  IconBrandSpotify,
  IconBrandTelegram,
  IconBrandThreads,
  IconBrandTiktok,
  IconBrandTwitch,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandYoutube,
  IconCalendar,
  IconClipboardList,
  IconCoin,
  IconHeart,
  IconLink,
  IconMail,
  IconMapPin,
  IconPhone,
  IconSchool,
  IconWorld,
  type Icon,
} from "@tabler/icons-react";
import type { IconRef } from "@/lib/content-types";
import type { IconName } from "@/lib/icon-names";

/** Ícones de linha (Tabler, licença MIT). LivePix usa uma moeda: envie o logo oficial se preferir. */
export const ICON_COMPONENTS: Record<IconName, Icon> = {
  youtube: IconBrandYoutube,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  twitch: IconBrandTwitch,
  kick: IconBrandKick,
  threads: IconBrandThreads,
  x: IconBrandX,
  discord: IconBrandDiscord,
  livepix: IconCoin,
  whatsapp: IconBrandWhatsapp,
  email: IconMail,
  telefone: IconPhone,
  facebook: IconBrandFacebook,
  linkedin: IconBrandLinkedin,
  spotify: IconBrandSpotify,
  telegram: IconBrandTelegram,
  pinterest: IconBrandPinterest,
  formulario: IconClipboardList,
  site: IconWorld,
  link: IconLink,
  calendario: IconCalendar,
  escola: IconSchool,
  endereco: IconMapPin,
  coracao: IconHeart,
};

/** Mostra o ícone de um botão: da biblioteca, imagem enviada, ou nada. */
export function BrandIcon({ icon, className, previewSrc }: { icon: IconRef; className?: string; previewSrc?: string | null }) {
  if (icon.type === "lib") {
    const C = ICON_COMPONENTS[icon.name];
    return C ? <C className={className} stroke={2} aria-hidden /> : null;
  }
  if (icon.type === "custom" || previewSrc) {
    const src = previewSrc ?? `/media/${icon.type === "custom" ? icon.mediaId : ""}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" aria-hidden className={`${className ?? ""} rounded-[6px] object-contain`} loading="lazy" decoding="async" />
    );
  }
  return null;
}
