"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function PurgeEndedButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (count === 0) return null;

  async function purge() {
    if (!confirm(`Apagar definitivamente ${count} sala(s) terminada(s)?`)) return;
    setBusy(true);
    try {
      await fetch("/api/admin/rooms/purge-ended", { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={purge}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {busy ? "A limpar…" : `Limpar ${count} terminada(s)`}
    </button>
  );
}
