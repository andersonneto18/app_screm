"use client";

import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";

export function AdminSettings({
  initialAllowUserBroadcast,
}: {
  initialAllowUserBroadcast: boolean;
}) {
  const [allow, setAllow] = useState(initialAllowUserBroadcast);
  const [saving, setSaving] = useState(false);

  async function update(next: boolean) {
    setAllow(next);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowUserBroadcast: next }),
      });
      if (!res.ok) setAllow(!next); // revert on failure
    } catch {
      setAllow(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardTitle>Permissões dos utilizadores</CardTitle>
      <CardDescription>
        Controla o que os teus amigos podem fazer.
      </CardDescription>
      <div className="mt-5">
        <Toggle
          label="Permitir que utilizadores criem salas e transmitam"
          hint={
            allow
              ? "Qualquer utilizador pode criar a própria sala."
              : "Só tu podes criar salas. Os utilizadores apenas assistem e interagem."
          }
          checked={allow}
          onChange={update}
        />
        {saving && (
          <p className="mt-2 text-xs text-muted-2">A guardar…</p>
        )}
      </div>
    </Card>
  );
}
