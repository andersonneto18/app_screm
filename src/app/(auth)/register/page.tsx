import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <Card>
      <CardTitle>Criar a sua conta</CardTitle>
      <CardDescription>
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </CardDescription>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </Card>
  );
}
