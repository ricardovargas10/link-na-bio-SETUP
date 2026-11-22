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
import type { IconName } from "@/lib/icon-names";

/** Ícones de linha (Tabler, licença MIT). LivePix usa uma moeda. */
const ICON_COMPONENTS: Record<IconName, Icon> = {
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

/** Ícone da biblioteca pelo nome. */
export function BrandIcon({ name, className }: { name: IconName; className?: string }) {
  const C = ICON_COMPONENTS[name];
  return C ? <C className={className} stroke={2} aria-hidden /> : null;
}
