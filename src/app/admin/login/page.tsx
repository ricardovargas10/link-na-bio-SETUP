import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { getAdminPath } from "@/lib/session-token";
import { LoginForm } from "./LoginForm";

export const instant = false;

export default async function LoginPage() {
  // Lê o endereço secreto na hora do acesso, nunca no build.
  await connection();
  const base = getAdminPath();
  if (!base) redirect("/");
  if (await isAuthenticated()) redirect(base);

  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Entrar no painel</h1>
      <p className="mt-2 text-[15px]">Use o usuário e a senha que você recebeu.</p>
      <LoginForm />
    </div>
  );
}
