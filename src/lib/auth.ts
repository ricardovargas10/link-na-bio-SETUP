import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

// Hash de uma senha aleatória, usado para gastar o mesmo tempo quando o usuário não existe.
const DUMMY_HASH = "$2b$12$RjW6edci.4LTiVDCgAM91.e62Dw19PPwLzcEJpgO0acXdQj9n0pPq";

function sameText(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Confere usuário e senha em tempo constante.
 * Sempre roda o bcrypt, mesmo com usuário errado, para não revelar qual dos dois errou.
 */
export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const validHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);

  const userOk = expectedUser.length > 0 && sameText(username, expectedUser);
  let passOk = false;
  try {
    passOk = await bcrypt.compare(password, validHash ? hash : DUMMY_HASH);
  } catch {
    passOk = false;
  }
  return userOk && passOk && validHash;
}
