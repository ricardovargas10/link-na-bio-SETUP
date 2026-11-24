"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ADMIN_PATH } from "@/lib/api";
import { useAdmin } from "../AdminData";
import { SocialForm, type SocialFormValues } from "../SocialForm";
import { Alert } from "../fields";
import { ListSkeleton } from "../Skeleton";

function Editor() {
  const id = useSearchParams().get("id") ?? "nova";
  const { data } = useAdmin();
  if (data === null) return <ListSkeleton />;
  if (data === "erro") return <Alert kind="error">Não consegui carregar agora. Atualize a página em instantes.</Alert>;

  const isNew = id === "nova";
  const s = isNew ? null : data.socials.find((x) => x.id === id);
  const back = (
    <Link href={`${ADMIN_PATH}/redes/`} className="text-[15px] font-semibold underline underline-offset-4">
      ← Voltar para as redes
    </Link>
  );
  if (!isNew && !s) {
    return (
      <div className="flex flex-col gap-4">
        <Alert kind="warning">Essa rede não existe mais.</Alert>
        {back}
      </div>
    );
  }

  const initial: SocialFormValues = s
    ? { id: s.id, label: s.label, url: s.url, icon: s.icon, visible: s.visible }
    : { label: "Instagram", url: "", icon: { type: "lib", name: "instagram" }, visible: true };

  return (
    <div>
      {back}
      <h1 className="mt-4 text-[28px] leading-tight font-semibold">{s ? "Editar rede" : "Nova rede"}</h1>
      <SocialForm key={id} initial={initial} />
    </div>
  );
}

export default function SocialEditPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Editor />
    </Suspense>
  );
}
