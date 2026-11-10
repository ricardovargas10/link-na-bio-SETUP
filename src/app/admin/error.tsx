"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mt-10 rounded-3xl border-2 border-raisin bg-white/70 p-6 text-center">
      <p className="text-lg font-bold">Algo deu errado.</p>
      <p className="mt-2 text-[15px]">
        Pode ser a internet ou a sua sessão que expirou. Tente de novo; se continuar, entre de novo no painel.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 min-h-12 rounded-2xl bg-raisin px-6 font-semibold text-shell"
      >
        Tentar de novo
      </button>
    </div>
  );
}
