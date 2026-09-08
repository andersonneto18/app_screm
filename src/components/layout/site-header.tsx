import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth/admin";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const session = await auth();
  const admin = isAdminEmail(session?.user?.email);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="ScreenRoom - início">
          <Logo />
        </Link>

        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              {admin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Painel</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/rooms">Salas abertas</Link>
              </Button>
              <UserMenu name={session.user.name ?? session.user.email ?? "Conta"} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/rooms">Explorar</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Criar conta</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
