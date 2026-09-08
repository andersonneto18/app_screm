import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-foreground" />
        <p>A transmissão nunca passa pelos nossos servidores — apenas WebRTC.</p>
        <p>© {new Date().getFullYear()} ScreenRoom</p>
      </div>
    </footer>
  );
}
