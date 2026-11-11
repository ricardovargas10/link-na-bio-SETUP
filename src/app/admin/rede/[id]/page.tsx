import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { readSocials } from "@/lib/content";
import { SocialForm, type SocialFormValues } from "../../SocialForm";

export const instant = false;

export default async function SocialEditPage({ params }: PageProps<"/admin/rede/[id]">) {
  const base = await requireAdminPage();
  const { id } = await params;
  const isNew = id === "nova";
  const s = isNew ? null : (await readSocials()).find((x) => x.id === id);
  if (!isNew && !s) notFound();

  const initial: SocialFormValues = s
    ? { id: s.id, label: s.label, url: s.url, icon: s.icon, visible: s.visible }
    : { label: "YouTube", url: "", icon: { type: "lib", name: "youtube" }, visible: true };

  return (
    <>
      <Link href={`${base}/redes`} className="text-[15px] font-semibold underline underline-offset-4">
        ← Voltar para as redes
      </Link>
      <h1 className="mt-4 text-[28px] leading-tight font-extrabold tracking-[-0.03em]">{s ? "Editar rede" : "Nova rede"}</h1>
      <SocialForm base={base} initial={initial} />
    </>
  );
}
