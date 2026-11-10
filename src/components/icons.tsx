import { Mail } from "lucide-react";
import type { FixedLinkIcon } from "@/config/links";

type IconProps = { className?: string };

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M16.5 7.5v.01" />
    </svg>
  );
}

export function LinkIcon({ icon, className }: { icon: FixedLinkIcon; className?: string }) {
  if (icon === "whatsapp") return <WhatsAppIcon className={className} />;
  if (icon === "instagram") return <InstagramIcon className={className} />;
  return <Mail className={className} aria-hidden strokeWidth={2} />;
}
