#!/usr/bin/env node
// Define o usuário e a senha do painel.
// Uso (Windows): npm.cmd run definir-senha
// Pergunta o usuário e a senha e grava em src/config/admin.ts só o hash bcrypt.
// A senha aparece enquanto você digita (alguns terminais não aceitam modo escondido);
// depois limpe a tela com "cls".
import { writeFileSync } from "node:fs";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const queue = [];
const waiting = [];
rl.on("line", (line) => (waiting.length ? waiting.shift()(line) : queue.push(line)));
rl.on("close", () => waiting.splice(0).forEach((w) => w("")));
function ask(question) {
  process.stdout.write(question);
  return queue.length ? Promise.resolve(queue.shift()) : new Promise((r) => waiting.push(r));
}

const username = (await ask("Usuário do painel (ex.: setup): ")).trim();
if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
  console.error("\nUsuário inválido: use de 3 a 40 letras, números, ponto, - ou _ (sem espaço e sem acento).");
  process.exit(1);
}
const password = (await ask("Senha (mínimo 10 caracteres): ")).trim();
if (password.length < 10) {
  console.error("\nA senha precisa ter pelo menos 10 caracteres.");
  process.exit(1);
}
const again = (await ask("Repita a senha: ")).trim();
if (again !== password) {
  console.error("\nAs senhas não são iguais. Rode o comando de novo.");
  process.exit(1);
}
rl.close();

const hash = await bcrypt.hash(password, 12);
const file = fileURLToPath(new URL("../src/config/admin.ts", import.meta.url));
writeFileSync(
  file,
  `/**
 * Usuário e senha do painel.
 *
 * NÃO edite à mão: rode \`npm run definir-senha\` (no Windows: \`npm.cmd run definir-senha\`).
 * O comando pergunta o usuário e a senha e grava aqui só o hash bcrypt da senha
 * (a senha em si nunca é salva).
 *
 * Se as variáveis ADMIN_USERNAME e ADMIN_PASSWORD_HASH existirem na Vercel,
 * elas são usadas só quando este arquivo estiver vazio.
 */
export const adminUsername = ${JSON.stringify(username)};
export const adminPasswordHash = ${JSON.stringify(hash)};
`,
  "utf8",
);

console.log("\nPronto! Usuário e senha salvos. Agora digite cls e aperte Enter para limpar a tela.");
console.log("Depois avise o Claude no chat que terminou.");
