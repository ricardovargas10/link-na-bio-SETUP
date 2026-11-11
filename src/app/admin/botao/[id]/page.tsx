import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { readButtons } from "@/lib/content";
import { isoToSpLocal } from "@/lib/time";
import { ButtonForm, type ButtonFormValues } from "../../ButtonForm";

export const instant = false;

export default async function ButtonEditPage({ params }: PageProps<"/admin/botao/[id]">) {
  const base = await requireAdminPage();
  const { id } = await params;
  const list = await readButtons();
  const isNew = id === "novo";
  const index = isNew ? -1 : list.findIndex((b) => b.id === id);
  if (!isNew && index < 0) notFound();
  const b = isNew ? null : list[index];

  const initial: ButtonFormValues = b
    ? {
        id: b.id,
        label: b.label,
        subtitle: b.subtitle ?? "",
        url: b.url,
        icon: b.icon,
        style: b.style,
        animation: b.animation,
        badge: b.badge ?? "",
        visible: b.visible,
        startsAt: isoToSpLocal(b.startsAt),
        endsAt: isoToSpLocal(b.endsAt),
        position: index + 1,
      }
    : {
        label: "",
        subtitle: "",
        url: "",
        icon: { type: "lib", name: "link" },
        style: "white",
        animation: "none",
        badge: "",
        visible: true,
        startsAt: "",
        endsAt: "",
        position: 1,
      };

  return (
    <>
      <Link href={base} className="text-[15px] font-semibold underline underline-offset-4">
        ← Voltar para os botões
      </Link>
      <h1 className="mt-4 text-[28px] leading-tight font-extrabold tracking-[-0.03em]">{b ? "Editar botão" : "Novo botão"}</h1>
      <ButtonForm base={base} initial={initial} maxPosition={isNew ? list.length + 1 : list.length} />
    </>
  );
}
