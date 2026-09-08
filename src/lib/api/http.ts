import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { logger } from "@/lib/logger";
import { PermissionError } from "@/lib/permissions";

/** Domain error with an HTTP status — thrown by services, caught by `handleRoute`. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError(401, "UNAUTHORIZED", "Autenticação necessária"),
  forbidden: (msg = "Sem permissão") => new AppError(403, "FORBIDDEN", msg),
  notFound: (msg = "Não encontrado") => new AppError(404, "NOT_FOUND", msg),
  conflict: (msg: string) => new AppError(409, "CONFLICT", msg),
  gone: (msg: string) => new AppError(410, "GONE", msg),
  tooMany: (msg = "Demasiados pedidos") =>
    new AppError(429, "RATE_LIMITED", msg),
  badRequest: (msg: string) => new AppError(400, "BAD_REQUEST", msg),
};

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw Errors.badRequest("Corpo JSON inválido");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError(422, "VALIDATION", "Dados inválidos");
  }
  return result.data;
}

/** Wrap a route handler: normalises thrown errors to JSON responses. */
export function handleRoute<Ctx = unknown>(
  fn: (req: Request, ctx: Ctx) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof PermissionError) {
        return json({ error: err.code, message: err.message }, { status: 403 });
      }
      if (err instanceof AppError) {
        return json(
          { error: err.code, message: err.message },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return json(
          { error: "VALIDATION", message: "Dados inválidos" },
          { status: 422 },
        );
      }
      logger.error({ err }, "Unhandled route error");
      return json(
        { error: "INTERNAL", message: "Erro interno" },
        { status: 500 },
      );
    }
  };
}

/** Best-effort client IP for rate-limit keys / ban hashing. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
