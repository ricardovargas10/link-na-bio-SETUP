import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { readPromos } from "@/lib/promos";
import { PromoForm } from "../PromoForm";

export const instant = false;

export default async function NewPromoPage() {
  const base = await requireAdminPage();
  let count = 0;
  try {
    count = (await readPromos()).length;
  } catch {
    /* o formulário avisa ao salvar se o banco estiver fora */
  }

  return (
    <>
      <Link href={base} className="text-[15px] font-semibold underline underline-offset-4">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Nova promoção</h1>
      <PromoForm
        base={base}
        maxPosition={count + 1}
        initial={{
          title: "",
          subtitle: "",
          badge: "",
          url: "",
          color: "orange",
          active: true,
          startsAt: "",
          endsAt: "",
          position: 1,
        }}
      />
    </>
  );
}
