import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { readPromos } from "@/lib/promos";
import { isoToSpLocal } from "@/lib/time";
import { PromoForm } from "../../PromoForm";

export const instant = false;

export default async function EditPromoPage({ params }: PageProps<"/admin/editar/[id]">) {
  const base = await requireAdminPage();
  const { id } = await params;
  const list = await readPromos();
  const index = list.findIndex((p) => p.id === id);
  if (index < 0) notFound();
  const p = list[index];

  return (
    <>
      <Link href={base} className="text-[15px] font-semibold underline underline-offset-4">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Editar promoção</h1>
      <PromoForm
        base={base}
        maxPosition={list.length}
        initial={{
          id: p.id,
          title: p.title,
          subtitle: p.subtitle ?? "",
          badge: p.badge ?? "",
          url: p.url,
          color: p.color,
          active: p.active,
          startsAt: isoToSpLocal(p.startsAt),
          endsAt: isoToSpLocal(p.endsAt),
          position: index + 1,
        }}
      />
    </>
  );
}
