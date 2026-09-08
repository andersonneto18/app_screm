import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security/password";
import { Errors } from "@/lib/api/http";
import type { RegisterInput } from "@/schemas/auth";

export async function registerUser(input: RegisterInput) {
  const existing = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw Errors.conflict("Já existe uma conta com este email");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: { id: true, name: true, email: true },
  });
  return user;
}
