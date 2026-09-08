"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
          checked ? "bg-primary" : "bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0 h-4.5 w-4.5 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-0.5",
          )}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </button>
    </label>
  );
}
