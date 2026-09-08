"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Accepts a bare slug, a /room/<slug> link, or a /join/<token> link. */
function parseInput(raw: string): { path: string } | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const m = url.pathname.match(/\/(room|join)\/([^/?#]+)/);
    if (m) return { path: `/${m[1]}/${m[2]}` };
  } catch {
    /* not a URL */
  }
  if (/^[0-9A-Za-z]{8,24}$/.test(value)) return { path: `/room/${value}` };
  return null;
}

export function JoinByCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInput(value);
    if (!parsed) {
      setError("Link ou código inválido");
      return;
    }
    router.push(parsed.path);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        autoFocus
        placeholder="cole o link ou código da sala"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full">
        Continuar
      </Button>
    </form>
  );
}
