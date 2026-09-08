import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { resolveInvite } from "@/server/services/invite-service";

export const dynamic = "force-dynamic";

export default async function InvitePage(props: PageProps<"/join/[token]">) {
  const { token } = await props.params;

  let slug: string | null = null;
  try {
    ({ slug } = await resolveInvite(token));
  } catch {
    slug = null;
  }

  if (slug) {
    redirect(`/room/${slug}?invite=${encodeURIComponent(token)}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <Card>
          <CardTitle>Convite inválido</CardTitle>
          <CardDescription>
            Este convite expirou, foi revogado ou já atingiu o limite de
            utilizações.
          </CardDescription>
          <a
            href="/join"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Entrar com um código
          </a>
        </Card>
      </main>
    </>
  );
}
