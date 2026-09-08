import { MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
        <MonitorPlay className="h-4 w-4" />
      </span>
      <span className="tracking-tight">ScreenRoom</span>
    </span>
  );
}
