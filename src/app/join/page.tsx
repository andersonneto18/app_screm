import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { JoinByCodeForm } from "@/features/rooms/join-by-code-form";

export const metadata: Metadata = { title: "Entrar numa sala" };

export default function JoinPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <Card>
          <CardTitle>Entrar numa sala</CardTitle>
          <CardDescription>
            Cole o link da sala ou introduza o código.
          </CardDescription>
          <div className="mt-6">
            <JoinByCodeForm />
          </div>
        </Card>
      </main>
    </>
  );
}
