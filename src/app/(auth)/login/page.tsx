import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Card>
      <CardTitle>Entrar na sua conta</CardTitle>
      <CardDescription>
        Ainda não tem conta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Criar conta
        </Link>
      </CardDescription>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </Card>
  );
}
