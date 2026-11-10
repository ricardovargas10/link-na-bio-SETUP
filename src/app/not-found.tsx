import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center px-5 text-center">
      <p className="text-[64px] leading-none font-extrabold tracking-[-0.04em]">404</p>
      <p className="mt-3 text-lg font-semibold">Página não encontrada.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-[20px] bg-raisin px-6 font-semibold text-shell"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
