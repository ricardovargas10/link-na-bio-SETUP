#!/usr/bin/env node
// Gera o hash bcrypt da senha do painel. A senha não aparece na tela nem é salva.
// Uso: npm run hash-password
import readline from "node:readline";
import bcrypt from "bcryptjs";

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin });
      rl.once("line", (line) => {
        rl.close();
        resolve(line);
      });
      return;
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const password = await askHidden("Senha do painel: ");
if (password.length < 10) {
  console.error("A senha precisa ter pelo menos 10 caracteres.");
  process.exit(1);
}
if (process.stdin.isTTY) {
  const again = await askHidden("Repita a senha: ");
  if (again !== password) {
    console.error("As senhas não são iguais.");
    process.exit(1);
  }
}

const hash = await bcrypt.hash(password, 12);
console.log("\nCole na Vercel, na variável ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("\nPara o arquivo .env.local (com os $ protegidos):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}\n`);
